# fbr-pp

Application Next.js qui transforme une photo de visage en portrait carré sur fond
bleu uni, avec un fin contour blanc autour du sujet.

## Fonctionnement

1. L'utilisateur dépose une photo (glisser-déposer ou sélection de fichier).
2. Il recadre son visage au format carré, avec un zoom réglable.
3. Le fond est retiré, remplacé par un bleu uni (`#009AA6`) et le sujet est
   entouré d'un trait blanc de 7 px.
4. Le portrait final est téléchargeable en PNG 1024 × 1024.

Le recadrage et le rendu final sont toujours faits au canvas dans le navigateur.
Seul le détourage change d'endroit, au choix de l'utilisateur :

- **Cloud** (par défaut) : le carré recadré est envoyé à
  [`POST /api/remove-background`](src/app/api/remove-background/route.ts), qui
  renvoie le PNG détouré. Rien à télécharger, environ 2 secondes.
- **Local** : le détourage tourne dans le navigateur, la photo ne quitte pas
  l'appareil. Le modèle (~90 Mo) est téléchargé au premier détourage puis mis en
  cache, avec une barre de progression.

## Configuration

Les deux modes sont actifs par défaut. Chacun se désactive par une variable
d'environnement (voir [`.env.example`](.env.example)) :

| Variable                  | Défaut | Effet si `false`                                |
| ------------------------- | ------ | ----------------------------------------------- |
| `ENABLE_CLOUD_PROCESSING` | `true` | Mode cloud masqué, l'API répond `404`           |
| `ENABLE_LOCAL_PROCESSING` | `true` | Mode local masqué, seul le cloud est proposé    |

Quand un seul mode reste actif, le sélecteur Cloud / Local n'est plus affiché.
Désactiver les deux fait échouer le rendu de la page avec une erreur explicite.

Ces variables sont lues à chaque requête côté serveur, pas au build : il suffit
de les modifier puis de redémarrer le conteneur, sans reconstruire l'image.

## Stack

- [Next.js](https://nextjs.org) (App Router) et [shadcn/ui](https://ui.shadcn.com)
- [`@imgly/background-removal-node`](https://github.com/imgly/background-removal-js)
  côté serveur (ONNX Runtime natif, modèle livré avec le package) et
  [`@imgly/background-removal`](https://github.com/imgly/background-removal-js)
  côté navigateur
- [`react-easy-crop`](https://github.com/ValentinH/react-easy-crop) pour le recadrage

Le rendu final (fond, contour, export) est fait au canvas dans
[`src/lib/portrait.ts`](src/lib/portrait.ts), où sont aussi définis la couleur de
fond, l'épaisseur du contour et la taille de sortie.

> `@imgly/background-removal` est distribué sous licence AGPL-3.0. Un usage
> commercial nécessite de respecter l'AGPL ou d'obtenir une licence auprès
> d'IMG.LY.

## Développement

```bash
npm install
npm run dev
```

L'application est disponible sur http://localhost:3000.

## Déploiement

Le `Dockerfile` produit une image autonome (build `standalone` de Next.js),
prête pour Coolify : port `3000`, aucune variable d'environnement requise (les
variables de [configuration](#configuration) sont optionnelles).

```bash
docker build -t fbr-pp . && docker run -p 3000:3000 fbr-pp
```

Pour ne proposer que le mode local, par exemple :

```bash
docker run -p 3000:3000 -e ENABLE_CLOUD_PROCESSING=false fbr-pp
```

L'image est basée sur Debian et **non sur Alpine** : `onnxruntime-node` ne
publie que des binaires liés à la glibc, qui ne peuvent pas se charger sur musl.
Elle pèse environ 800 Mo, dont ~127 Mo de modèle ONNX et ~31 Mo de runtime natif.

Prévoir au moins 2 Go de RAM sur la machine : l'inférence charge le modèle en
mémoire à la première requête.
