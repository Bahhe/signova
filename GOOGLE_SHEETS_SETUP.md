# Configuration de l'intégration Google Sheets / Google Sheets Setup

L'application supporte deux méthodes simples pour enregistrer automatiquement chaque commande dans votre feuille Google Sheets :

---

## Méthode 1 : Google Apps Script Webhook (Recommandée - Plus rapide & facile)

Cette méthode ne nécessite **aucun compte Google Cloud Platform ni carte bancaire**. En 2 minutes, votre feuille est connectée :

1. Ouvrez votre **Google Sheet** (ou créez-en une nouvelle).
2. Dans la première ligne, ajoutez les en-têtes suivants :
   | A | B | C | D | E | F | G | H | I | J | K | L | M |
   |---|---|---|---|---|---|---|---|---|---|---|---|---|
   | Order ID | Date | Nom & Prénom | Téléphone | Wilaya | Commune | Livraison | Produit | Prix | Quantité | Total | Remarques | Statut |
3. Dans le menu du haut, cliquez sur **Extensions** > **Apps Script**.
4. Supprimez tout le code existant et collez ce script :

```javascript
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    
    sheet.appendRow([
      data.orderId || ('ORD-' + Utilities.getUuid().substring(0, 8)),
      data.createdAt || new Date().toLocaleString("fr-DZ"),
      data.fullName || '',
      "'" + (data.phone || ''), // apostrophe ensures phone number is saved as text without losing leading 0
      data.wilaya || '',
      data.commune || '',
      data.deliveryType === 'home delivery' ? 'À Domicile' : 'Stop Desk (Point Relais)',
      data.productTitle || '',
      data.productPrice || '',
      data.quantity || 1,
      data.totalAmount || '',
      data.notes || '',
      data.status || 'New'
    ]);
    
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success', orderId: data.orderId }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

5. Cliquez sur **Déployer (Deploy)** > **Nouveau déploiement (New deployment)**.
6. Cliquez sur l'engrenage à côté de "Sélectionner le type", choisissez **Application Web (Web app)**.
7. Remplissez les champs :
   - **Exécuter en tant que (Execute as)** : `Moi (votre compte)`
   - **Qui a accès (Who has access)** : `Tout le monde (Anyone)` *(Indispensable pour que le serveur puisse poster les commandes)*
8. Cliquez sur **Déployer**, autorisez les autorisations Google, puis copiez l'**URL de l'application Web** (`https://script.google.com/macros/s/.../exec`).
9. Ajoutez cette URL dans votre fichier `.env` :
   ```env
   GOOGLE_SHEET_WEBHOOK_URL=https://script.google.com/macros/s/votre_identifiant_unique/exec
   ```

---

## Méthode 2 : Google Sheets API v4 (Compte de Service GCP)

Si vous préférez utiliser l'API officielle Google Sheets v4 avec un compte de service :

1. Rendez-vous sur la console [Google Cloud Platform](https://console.cloud.google.com/).
2. Créez un projet ou sélectionnez un projet existant.
3. Activez l'API **Google Sheets API** dans la bibliothèque d'API.
4. Allez dans **IAM & Administration** > **Comptes de service (Service Accounts)** > **Créer un compte de service**.
5. Donnez-lui un nom (ex: `order-bot`) et terminez.
6. Cliquez sur le compte de service créé > onglet **Clés (Keys)** > **Ajouter une clé** > **Créer une clé** > choisissez **JSON**. Le fichier sera téléchargé sur votre ordinateur.
7. Ouvrez votre Google Sheet et **partagez-la en tant qu'Éditeur** avec l'adresse e-mail de votre compte de service (ex: `order-bot@votre-projet.iam.gserviceaccount.com`).
8. Récupérez l'ID de votre feuille depuis son URL :
   `https://docs.google.com/spreadsheets/d/`**`1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`**`/edit`
9. Dans votre `.env`, configurez :
    ```env
    GOOGLE_SHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
    GOOGLE_SERVICE_ACCOUNT_EMAIL=order-bot@votre-projet.iam.gserviceaccount.com
    GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC6...\n-----END PRIVATE KEY-----\n"
    GOOGLE_SHEET_RANGE=Sheet1
    ```
    
    > **Astuce Production (Vercel, Railway, Docker, Coolify) :**  
    > Si vous rencontrez des difficultés avec les sauts de ligne de la clé privée, vous pouvez aussi simplement définir :
    > ```env
    > GOOGLE_SERVICE_ACCOUNT_KEY_JSON='{"type":"service_account","project_id":"...","private_key":"..."}'
    > ```
    > Ou coller le contenu JSON complet encodé en base64. Le système normalise et nettoie automatiquement les guillemets, sauts de ligne échappés (`\n` ou `\\n`) et encodages.

---

## Sauvegarde Locale Automatique

Tant que les variables Google Sheets ne sont pas configurées dans `.env`, **aucune commande n'est perdue** :
- Le formulaire fonctionne immédiatement en mode de développement.
- Toutes les commandes sont enregistrées automatiquement dans le fichier local `data/orders.json`.
- Vous pouvez visualiser l'historique complet des commandes reçues à tout moment.
