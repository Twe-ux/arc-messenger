# Product Requirements Document (PRD)

## Application de Messagerie Web - Style Arc Browser × WhatsApp

### 1. Vue d'ensemble du produit

#### 1.1 Vision

Créer une application web de messagerie qui combine la simplicité et les fonctionnalités de WhatsApp avec l'interface moderne et épurée d'Arc Browser, en intégrant les boîtes mail existantes des utilisateurs.

#### 1.2 Objectifs principaux

- Unifier les communications email et messagerie instantanée dans une seule interface
- Offrir une expérience utilisateur fluide et moderne inspirée d'Arc Browser
- Permettre une gestion efficace des conversations avec des fonctionnalités de productivité avancées

#### 1.3 Utilisateurs cibles

- Professionnels cherchant à centraliser leurs communications
- Utilisateurs souhaitant une alternative moderne aux clients mail traditionnels
- Équipes collaboratives nécessitant une communication rapide et organisée

### 2. Stack technique

#### 2.1 Technologies principales

- **Frontend**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS + Framer Motion (animations)
- **Base de données**: MongoDB avec Mongoose
- **Authentification**: NextAuth.js
- **API Email**: Gmail API (phase 1), puis Outlook, Yahoo (phases suivantes)
- **WebSockets**: Socket.io pour le temps réel
- **Stockage fichiers**: AWS S3 ou Cloudinary
- **Hébergement**: Vercel (frontend) + MongoDB Atlas (database)

#### 2.2 Packages additionnels recommandés

- `react-resizable-panels` - Pour les panneaux redimensionnables
- `react-beautiful-dnd` - Pour le drag & drop
- `date-fns` - Gestion des dates
- `react-hook-form` + `zod` - Formulaires et validation
- `@tanstack/react-query` - Gestion du cache et des requêtes
- `zustand` - State management léger

### 3. Architecture de l'application

#### 3.1 Structure des composants principaux

```
/app
  /(auth)
    /login
    /register
  /(main)
    /inbox
    /[conversationId]
    /settings
    /profile

/components
  /sidebar
    - Sidebar.tsx
    - CategoryBar.tsx
    - ConversationList.tsx
  /chat
    - ChatView.tsx
    - MessageBubble.tsx
    - InputBar.tsx
  /mail
    - MailView.tsx
    - MailComposer.tsx
  /shared
    - SplitView.tsx
    - ResizablePanel.tsx
```

#### 3.2 Modèles de données MongoDB

```javascript
// User Schema
{
  _id: ObjectId,
  email: String,
  name: String,
  avatar: String,
  gmailTokens: {
    accessToken: String,
    refreshToken: String
  },
  preferences: {
    theme: String,
    notifications: Object
  },
  createdAt: Date
}

// Conversation Schema
{
  _id: ObjectId,
  participants: [ObjectId], // User IDs
  type: String, // 'chat' | 'email'
  lastMessage: {
    content: String,
    timestamp: Date,
    senderId: ObjectId
  },
  unreadCount: Number,
  category: String, // 'inbox' | 'personal' | 'work' | 'archived'
  metadata: {
    emailThreadId: String, // Pour les conversations email
    subject: String
  }
}

// Message Schema
{
  _id: ObjectId,
  conversationId: ObjectId,
  senderId: ObjectId,
  content: String,
  attachments: [{
    url: String,
    type: String,
    name: String
  }],
  status: String, // 'sent' | 'delivered' | 'read'
  timestamp: Date,
  replyTo: ObjectId, // Pour les réponses
  emailMetadata: {
    messageId: String,
    headers: Object
  }
}
```

### 4. Fonctionnalités détaillées

#### 4.1 Sidebar (Barre latérale)

- **Design violet/purple** comme Arc Browser
- **Liste des conversations** avec aperçu du dernier message
- **Indicateurs** : messages non lus, statut en ligne
- **Recherche** intégrée en haut
- **Collapse/Expand** : Click sur l'icône en haut à gauche pour masquer/afficher
- **Swipe gestures** : Glisser pour changer de catégorie

#### 4.2 Catégories (Barre du bas)

- **Icônes personnalisables** pour différentes catégories :
  - 🏠 Inbox (tous les messages)
  - 👤 Personnel
  - 💼 Travail
  - 🔥 Favoris
  - 📁 Archivés
- **Drag & drop** pour réorganiser les conversations
- **Badges** de notification par catégorie

#### 4.3 Vue principale (Chat/Email)

- **Interface unifiée** pour chat et emails
- **Bulles de messages** style WhatsApp
- **Informations contextuelles** :
  - Heure d'envoi
  - Statut de lecture
  - Indicateur de frappe
- **Support des médias** : images, vidéos, documents
- **Réactions emoji** sur les messages
- **Réponse à un message spécifique**

#### 4.4 Mode Split View

- **Deux conversations côte à côte**
- **Barre de redimensionnement** draggable entre les deux panneaux
- **Sauvegarde de la disposition** préférée
- **Raccourcis clavier** pour naviguer entre les vues

#### 4.5 Intégration Gmail (Phase 1)

- **OAuth2 authentication** avec Google
- **Sync bidirectionnel** des emails
- **Conversion email → chat** : les emails apparaissent comme des messages
- **Réponse rapide** : répondre aux emails comme à des messages instantanés
- **Threading intelligent** : regroupement des emails par conversation

#### 4.6 Fonctionnalités temps réel

- **Indicateur de frappe** en temps réel
- **Statut en ligne/hors ligne**
- **Notifications push** (avec permission utilisateur)
- **Synchronisation multi-appareils**

### 5. Design et UX

#### 5.1 Palette de couleurs

- **Primaire**: Violet/Purple (#8B5CF6 - inspiré d'Arc)
- **Secondaire**: Rose pâle (#FDF2F8 - arrière-plan)
- **Accent**: Bleu clair pour les liens et actions
- **Neutre**: Grays pour le texte et les bordures

#### 5.2 Typographie

- **Police principale**: Inter ou SF Pro (système)
- **Tailles**:
  - Titre conversation: 16px semi-bold
  - Messages: 14px regular
  - Métadonnées: 12px regular

#### 5.3 Animations et transitions

- **Transitions fluides** entre les vues (Framer Motion)
- **Animations de chargement** skeleton
- **Feedback visuel** sur toutes les interactions
- **Micro-animations** pour les icônes et boutons

### 6. Sécurité et performance

#### 6.1 Sécurité

- **Chiffrement** des tokens d'authentification
- **HTTPS** obligatoire
- **Rate limiting** sur les API
- **Validation** côté serveur de toutes les entrées
- **CSP headers** pour prévenir XSS

#### 6.2 Performance

- **Lazy loading** des messages anciens
- **Optimisation des images** (WebP, compression)
- **Cache intelligent** avec React Query
- **Code splitting** par route
- **Service Worker** pour le mode offline

### 7. Roadmap de développement

#### Phase 1 (MVP - 8 semaines)

- [ ] Setup projet et architecture
- [ ] Authentification utilisateur
- [ ] Interface de base (sidebar + chat view)
- [ ] Intégration Gmail basique
- [ ] Messagerie temps réel simple
- [ ] Profil utilisateur

#### Phase 2 (4 semaines)

- [ ] Split view fonctionnel
- [ ] Catégories et organisation
- [ ] Recherche avancée
- [ ] Attachments et médias
- [ ] Notifications

#### Phase 3 (4 semaines)

- [ ] Intégration Outlook
- [ ] Mode sombre
- [ ] Paramètres avancés
- [ ] Export de conversations
- [ ] Analytics dashboard

#### Phase 4 (À définir)

- [ ] Application mobile (React Native)
- [ ] Intégrations supplémentaires (Slack, Teams)
- [ ] IA pour résumés et suggestions
- [ ] Fonctionnalités entreprise

### 8. Métriques de succès

- **Taux d'adoption**: 1000 utilisateurs actifs dans les 3 premiers mois
- **Engagement**: 5+ conversations actives par utilisateur/jour
- **Rétention**: 60% de rétention à 30 jours
- **Performance**: Temps de chargement < 2s
- **Satisfaction**: NPS > 50

### 9. Considérations futures

- **Monétisation**: Modèle freemium avec features pro
- **Scalabilité**: Architecture microservices si croissance
- **Internationalisation**: Support multi-langues
- **Accessibilité**: Conformité WCAG 2.1 AA
- **API publique**: Pour intégrations tierces

### 10. Ressources nécessaires

#### Équipe

- 1 Product Manager
- 2 Développeurs Full-Stack
- 1 Designer UI/UX
- 1 DevOps (mi-temps)

#### Budget estimé

- Infrastructure: ~$500/mois (début)
- Services tiers: ~$300/mois
- Outils de développement: ~$200/mois

---

Ce PRD servira de guide pour le développement de l'application. Il est conçu pour être évolutif et sera mis à jour régulièrement en fonction des retours utilisateurs et des nouvelles opportunités identifiées.
