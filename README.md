# fbr-pp

Application Next.js qui transforme une photo de visage en portrait carré sur fond
bleu uni, avec un fin contour blanc autour du sujet.

## Fonctionnement

1. L'utilisateur dépose une photo (glisser-déposer ou sélection de fichier).
2. Il recadre son visage au format carré, avec un zoom réglable.
3. Le fond est retiré, remplacé par un bleu foncé et le sujet est entouré d'un
   trait blanc fin.
4. Le portrait final est téléchargeable en PNG 1024 × 1024.

Tout le traitement se fait dans le navigateur : aucune image n'est envoyée sur un
serveur. Le modèle de segmentation (~40 Mo) est téléchargé au premier détourage
puis mis en cache par le navigateur.

## Stack

- [Next.js](https://nextjs.org) (App Router) et [shadcn/ui](https://ui.shadcn.com)
- [`@imgly/background-removal`](https://github.com/imgly/background-removal-js)
  pour la suppression du fond, côté client
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
