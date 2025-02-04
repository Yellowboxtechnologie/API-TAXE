# API Documentation - Authentication Middlewares & Operator Management

## Table of Contents
1. [Authentication Middlewares](#authentication-middlewares)   
   - [isAdmin](#isadmin)  
   - [isMerchant](#ismerchant)  
   - [isOperator](#isoperator)  
2. [Create Operator Endpoint](#create-operator-endpoint)  
3. [Security Considerations](#security-considerations)  
4. [Error Handling](#error-handling)  
5. [Examples](#examples)  


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

# API Documentation - Create Operator Account

## Endpoint
`POST /api/operators/create`

## Description  
Crée un nouveau compte opérateur après vérification de l'unicité du numéro de téléphone. Ce endpoint est généralement utilisé par les administrateurs pour ajouter de nouveaux opérateurs au système.

---

## Requête

### Paramètres du corps (JSON)

| Paramètre | Type   | Obligatoire | Description                          |
|-----------|--------|-------------|--------------------------------------|
| name      | string | Oui         | Nom complet de l'opérateur           |
| phone     | string | Oui         | Numéro de téléphone de l'opérateur   |

### Exemple de Requête
```json
{
  "name": "John Doe",
  "phone": "+243900000000"
}
```

# API Documentation - Update Operator Account

## Endpoint
`PUT /api/operators/update`

## Description  
Met à jour les informations d'un opérateur existant (nom et numéro de téléphone) après vérification de l'existence du compte. Ce endpoint est généralement utilisé par les administrateurs pour modifier les détails d'un opérateur.

---

## Requête

### Paramètres du corps (JSON)

| Paramètre | Type   | Obligatoire | Description                          |
|-----------|--------|-------------|--------------------------------------|
| operatorId| int    | Oui         | ID de l'opérateur à modifier         |
| name      | string | Oui         | Nouveau nom de l'opérateur           |
| phone     | string | Oui         | Nouveau numéro de téléphone          |

### Exemple de Requête
```json
{
  "operatorId": 123,
  "name": "John Doe Updated",
  "phone": "+243900000001"
}
```

# API Documentation - Disable Operator Account

## Endpoint
`PUT /api/operators/disable`

## Description  
Désactive un compte opérateur en mettant à jour le champ `isActive` à `false`. Ce endpoint est généralement utilisé par les administrateurs pour désactiver temporairement ou définitivement un opérateur.

---

## Requête

### Paramètres du corps (JSON)

| Paramètre | Type   | Obligatoire | Description                          |
|-----------|--------|-------------|--------------------------------------|
| operatorId| int    | Oui         | ID de l'opérateur à désactiver       |

### Exemple de Requête
```json
{
  "operatorId": 123
}
```
# API Documentation - Activate Operator Account

## Endpoint
`PUT /api/operators/activate`

## Description  
Active un compte opérateur en mettant à jour le champ `isActive` à `true`. Ce endpoint est généralement utilisé par les administrateurs pour réactiver un opérateur précédemment désactivé.

---

## Requête

### Paramètres du corps (JSON)

| Paramètre | Type   | Obligatoire | Description                          |
|-----------|--------|-------------|--------------------------------------|
| operatorId| int    | Oui         | ID de l'opérateur à activer          |

### Exemple de Requête
```json
{
  "operatorId": 123
}
```

# API Documentation - List Operators

## Endpoint
`GET /api/operators/list`

## Description  
Récupère la liste complète des opérateurs enregistrés dans le système. Ce endpoint est généralement utilisé par les administrateurs pour consulter les comptes opérateurs.

---

## Requête

### Paramètres
Aucun paramètre requis.

---

## Réponses

### Succès (200 OK)
```json
{
  "status": "success",
  "data": [
    {
      "id": 123,
      "name": "John Doe",
      "phone": "+243900000000",
      "isActive": true
    },
    {
      "id": 124,
      "name": "Jane Smith",
      "phone": "+243900000001",
      "isActive": false
    }
  ]
}
```
# API Documentation - List Active Operators

## Endpoint
`GET /api/operators/list-active`

## Description  
Récupère la liste des opérateurs actuellement actifs dans le système. Ce endpoint est utile pour obtenir une liste filtrée des opérateurs disponibles pour des opérations en temps réel.

---

## Requête

### Paramètres
Aucun paramètre requis.

---

## Réponses

### Succès (200 OK)
```json
{
  "status": "success",
  "data": [
    {
      "id": 123,
      "name": "John Doe",
      "phone": "+243900000000"
    },
    {
      "id": 124,
      "name": "Jane Smith",
      "phone": "+243900000001"
    }
  ]
}
```

# API Documentation - List Inactive Operators

## Endpoint
`GET /api/operators/list-inactive`

## Description  
Récupère la liste des opérateurs actuellement inactifs (désactivés) dans le système. Ce endpoint permet aux administrateurs de visualiser les comptes désactivés.

---

## Requête

### Paramètres
Aucun paramètre requis.

---

## Réponses

### Succès (200 OK)
```json
{
  "status": "success",
  "data": [
    {
      "id": 125,
      "name": "Bob Johnson",
      "phone": "+243900000002"
    },
    {
      "id": 126,
      "name": "Alice Brown",
      "phone": "+243900000003"
    }
  ]
}
```

# API Documentation - Admin Login

## Endpoint
`POST /api/admins/login`

## Description  
Authentifie un administrateur via son email et mot de passe. Retourne un token JWT et des informations basiques en cas de succès.

---

## Requête

### Paramètres du corps (JSON)

| Paramètre | Type   | Obligatoire | Description          |
|-----------|--------|-------------|----------------------|
| email     | string | Oui         | Email de l'admin     |
| password  | string | Oui         | Mot de passe         |

### Exemple
```json
{
  "email": "admin@example.com",
  "password": "motdepasse123"
}
```

## 📌 Requête pour créer un opérateur

### 📍 Endpoint
`POST /create-operator`

### 🔑 Headers
```json
{
  "Authorization": "Bearer VOTRE_TOKEN_Ici",
  "Content-Type": "application/json"
}
```
### 📝 Body
```json
{
  "name": "Nom de l'opérateur",
  "phone": "+33612345678"
}
```