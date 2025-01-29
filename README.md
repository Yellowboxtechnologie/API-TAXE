# API Documentation - Customer Login

## Endpoint
`POST /api/login`

## Description  
Authentifie un client à partir de son numéro de téléphone et mot de passe. Retourne les informations du client et un token JWT en cas de succès.

---

## Requête

### Paramètres du corps (JSON)

| Paramètre | Type   | Obligatoire | Description          |
|-----------|--------|-------------|----------------------|
| phone     | string | Oui         | Numéro de téléphone  |
| password  | string | Oui         | Mot de passe client |

### Exemple
```json
{
  "phone": "+243900000000",
  "password": "motdepasse123"
}
```

### Réponses

#### Succès (200 OK)

```json
{
  "status": "success",
  "data": {
    "name": "John Doe",
    "address": "Kinshasa, Gombe",
    "cni": "01-2345-67890",
    "rccm": "CD/RCCM/1234567",
    "activity": "Commerce",
    "qrcode": "base64_qrcode_data",
    "token": "jwt_token_here"
  }
}
```

#### Erreurs Possibles

| Code d'erreur | Description                                  |
|--------------|----------------------------------------------|
| 400 Bad Request - Champs manquants                    | Veuillez fournir tous les champs requis. |
| 401 Unauthorized - Compte désactivé ou Mot de passe invalide | Votre compte est désactivé / Mot de passe incorrect. |
| 409 Conflict - Compte inexistant                      | Nous n'avons pas pu trouver un compte correspondant. |
| 500 Internal Server Error                            | Erreur serveur lors de la connexion. | 

# API Documentation - Update Customer Password

## Endpoint
`PUT /api/customers/update-password`

## Description  
Permet à un client de mettre à jour son mot de passe après vérification de l'ancien mot de passe et validation du token JWT.

---

## Requête

### Headers

| Clé               | Valeur Requise         | Exemple                     |
|-------------------|------------------------|-----------------------------|
| Authorization     | Bearer `<JWT_TOKEN>`   | `Bearer eyJhbGciOiJIUz...`  |

### Paramètres du corps (JSON)

| Paramètre   | Type   | Obligatoire | Description                          |
|-------------|--------|-------------|--------------------------------------|
| oldPassword | string | Oui         | Mot de passe actuel du client        |
| newPassword | string | Oui         | Nouveau mot de passe (non haché)     |

### Exemple de Requête
```json
{
  "oldPassword": "ancienMotDePasse123",
  "newPassword": "nouveauMotDePasse456"
}

```
### Réponses

#### Succès (200 OK)

```json
{
  "status": "success",
  "message": "Votre mot de passe a été mis à jour avec succès..."
}
```

# API Documentation - Update Customer Token

## Endpoint
`PUT /api/customers/update-token`

## Description  
Permet à un client de mettre à jour son token (ex: token de notification) après validation du token JWT d'authentification.

---

## Requête

### Headers

| Clé               | Valeur Requise         | Exemple                     |
|-------------------|------------------------|-----------------------------|
| Authorization     | Bearer `<JWT_TOKEN>`   | `Bearer eyJhbGciOiJIUz...`  |

### Paramètres du corps (JSON)

| Paramètre | Type   | Obligatoire | Description                          |
|-----------|--------|-------------|--------------------------------------|
| token     | string | Oui         | Nouveau token à enregistrer          |

### Exemple de Requête
```json
{
  "token": "fcm_device_token_123"
}

```
### Réponses

#### Succès (200 OK)

```json
{
  "status": "success",
  "message": "Le token a été mis à jour avec succès."
}
```

# API Documentation - Get Customer Transactions

## Endpoint
`GET /api/customers/transactions`

## Description  
Récupère l'historique des transactions d'un client après validation de son token JWT. Les transactions sont triées par date de création décroissante.

---

## Requête

### Headers

| Clé               | Valeur Requise         | Exemple                     |
|-------------------|------------------------|-----------------------------|
| Authorization     | Bearer `<JWT_TOKEN>`   | `Bearer eyJhbGciOiJIUz...`  |

---

## Réponses

### Succès (200 OK)
```json
{
  "status": "success",
  "data": [
    {
      "ticket": "TX-489AB",
      "amount": 150.75,
      "createdAt": "2023-08-15T09:30:45.000Z"
    },
    {
      "ticket": "TX-782GH",
      "amount": 89.99,
      "createdAt": "2023-08-14T14:20:15.000Z"
    }
  ]
}
```

# API Documentation - Delete Customer Account (Soft Delete)

## Endpoint
`DELETE /api/customers/delete-account`

## Description  
Effectue une suppression "douce" du compte client en anonymisant le numéro de téléphone. Conserve les données historiques tout en rendant le compte inutilisable.

---

## Requête

### Headers

| Clé               | Valeur Requise         | Exemple                     |
|-------------------|------------------------|-----------------------------|
| Authorization     | Bearer `<JWT_TOKEN>`   | `Bearer eyJhbGciOiJIUz...`  |

---

## Réponses

### Succès (200 OK)
```json
{
  "status": "success",
  "message": "Votre compte a été supprimé avec succès..."
}
```