NTools
======

Accédez aux informations importantes du markup en 1 clic ou moins pour
développer plus rapidement.

![toolbar](https://raw.githubusercontent.com/NerOcrO/ntools/master/toolbar.png)

## L'essayer, c'est l'adopter !

Si vous voulez tester NTools avant de l'installer, créez un marque-page et
mettez-y ce bookmarklet :

```
javascript:(function(){var script=document.createElement('script');script.src='https://rawgit.com/NerOcrO/ntools/master/ntools.user.js?'+Math.floor(new Date);document.body.appendChild(script);})()
```

et regardez tout ce que vous pouvez faire sur votre Drupal favori !

## Installation

### Firefox

* Installer [greasemonkey](https://addons.mozilla.org/fr/firefox/addon/greasemonkey/)
* [Cliquez ici et installer le script](https://github.com/NerOcrO/ntools/raw/master/ntools.user.js)
* Cliquez ensuite sur la tête de singe qui se trouve à côté de votre barre
d'adresse, puis sur NTools->edit
* Remplacez "localhost" par le domaine sur lequel vous voulez que NTools
s'applique (e.g. : http://nerocro.monsite.fr/*)

### Chrome

* Installer [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
* [Cliquez ici et installer le script](https://github.com/NerOcrO/ntools/raw/master/ntools.user.js)
* Cliquez sur l'icône Tampermonkey à côté de votre barre d'adresse puis
"Tableau de bord"
* Cliquez sur la ligne NTools
* Remplacez "localhost" par le domaine sur lequel vous voulez que NTools
s'applique (e.g. : http://nerocro.monsite.fr/*)

### Mes pages exclues

* \*/update.php*
* \*/batch?*

### Thème Drupal

* Téléchargez ou clonez ce dépôt
* Placez le script JS dans le répertoire js/ de votre thème
* Supprimez les neuf premières lignes en rapport avec greasemonkey
* Insérez dans votre_theme.info : `scripts[] = js/ntools.user.js`

## Pourquoi ?

Étant quotidiennement amené à travailler sur plusieurs Drupal différents dans
une journée, j'ai besoin de trouver l'information rapidement. Du coup j'ai
développé ce script pour éviter des tâches répétitives comme utiliser
l'inspecteur d'élément pour trouver comment s'appelle une vue, comment s'appelle
un bloc, suis-je sur un node, quel est le nid du node en cours, quel est le nom
machine d'une taxonomie, d'une vue, d'un bloc...
En **1 clic** (ou moins), j'accède à toutes ces informations soit avec un effet
visuel soit un colonne en plus dans un tableau (admin) ou soit un lien.

## Je suis un client et je ne sais pas utiliser l'inspecteur d'élément, est-ce que je peux utiliser ce script ?

Bien sûr !

Ce script n'est pas fait que pour les développeurs, en effet, vous pouvez le
fournir à votre chef de projet ou votre client pour qu'en un clin d'œil, il
vous donne certaines informations importantes pour gagner du temps au téléphone
ou dans l'énoncé d'un(e) tâche/bug.

## Pourquoi pas un module contrib ou améliorer le core ?

Bonne question !

Créer un module ; oui mais généralement, on ne met pas les modules d'aide aux
développeurs sur une production, or j'en ai besoin en production.
Améliorer un module existant ou le core ; oui mais ça prend du temps à valider
et les gens peuvent ne pas être d'accord avec ce que je propose.

L'avantage de ce module est qu'il s'installe rapidement sur n'importe quelle
version de Drupal 7, sur n'importe quel domaine (dev/preprod/prod), sur
n'importe quel navigateur qui gère les "user script" et il n'est pas intrusif.
L'inconvénient, c'est que c'est du Javascript :D Néanmoins, j'ai appris pas mal
de chose sur le fonctionnement de Drupal.

L'autre idée que j'avais derrière la tête était que ce script peut être un bac
à sable, une sorte de beta test avant intégration dans le core si ça plaît aux
gens.

## Est-ce que ce script est compatible avec Drupal 6 ?

Un peu...

## ~~Guichet~~ Front office

### La mer noire ? non la barre noire !

La barre d'outils se colle sur le côté gauche par défaut, est repliable/dépliable
au double clique et vous pouvez la déplacer où vous voulez. La configuration est
enregistré grâce au cookies ntools_toggle et ntools_toggle_positions.

### Lien de connexion

#### Philosophie

Parfois, je n'ai pas le formulaire d'authentification à porter de main sur
toutes les pages (problème de conception !) ou je dois cliquer sur un pseudo
lien pour qu'il s'affiche, du coup, je tape dans mon navigateur user/
ce qui est fatiguant...

#### Fonctionnalité

Affichage d'un lien qui redirige vers /user avec le paramètre destination.

#### Bonus track

J'ai ajouter le focus sur le name du formulaire d'authentification comme ça, si
vous avez enregistrer vos identifiants, vous n'avez plus qu'à appuyer sur la
touche entrée.

### Lien de déconnexion

#### Philosophie

Parfois, je n'ai pas le lien de déconnexion à portée de main sur toutes les
pages (problème de conception !) ou il faut cliquer sur un pseudo lien pour
qu'il s'affiche, du coup, je tape dans mon navigateur user/
ce qui est fatiguant...

### Fonctionnalité

Affichage d'un lien pour se déconnecter.

#### Problèmes connus

* Le préfixe de langue n'est pas pris en compte.
* Fonctionne uniquement si vous avez créée un domaine.

### Classes du body

#### Philosophie

Quand j'arrive sur une page tiré d'un bug sans description, je ne sais pas
forcément sur quel type de page je suis. Une entité ? De quel type ?
Quel est son nid ? J'ouvre donc l'inspecteur d'élément...

#### Fonctionnalité

Affichage des classes commençant par "page-node-", "node-type-", "page-type-",
"page-taxonomy-term-" et "page-user-".
Affichage également de "context-" avec un lien pour les modifier.

### Masquerade

#### Philosophie

Lors des tests, il faut souvent changer d'utilisateur alors on ouvre plusieurs
navigateurs en même temps ce qui n'est pas forcément pratique. Il y a aussi
la possibilité d'utiliser le module [Administration menu](https://www.drupal.org/project/admin_menu)
qui est juste indispensable mais son switch d'utilisateur est... nul.

#### Installation

Du coup, mieux vaut installer le module [masquerade](https://www.drupal.org/project/masquerade).
Ensuite, il faut le placer dans la région "footer".
`drush block-configure --module=masquerade --delta=masquerade --region=footer`

Il faut avoir installer [drush_extras](https://www.drupal.org/project/drush_extras)
au préalable.

#### Fonctionnalité

Intégration du bloc masquerade dans notre barre pour l'avoir tout le temps.

Ajout des rôles sur chaque utilisateur (attribut title)
en attendant [cette fonctionnalité](https://www.drupal.org/node/2355069).

### Mise en évidence d'éléments récurrents

#### Philosophie

De manière générale, lors d'un développement ou d'une résolution de bug, je
passe énormément de temps avec l'inspecteur d'élément pour visualiser les
classes/id appartenant à un node, un champ, une vue et j'en passe ; c'est très
long et chiant surtout quand je passe derrière un collègue ou trois mois après.

#### Fonctionnalité

Ajout de boutons pour mieux visualiser les régions, blocs, vues, nodes,
profiles, champs, paragraphes, médias et formulaires. Ces boutons ne s'affichent
uniquement que si ces éléments sont présents dans la page. Au clic, un calque
noir transparent s'affiche sur l'espace occupé par l'élément avec son
identifiant pour mieux le chercher dans votre code. Au clic sur cette dernière,
elle disparait. Si vous ne voyez rien apparaître, c'est que l'élément est caché
et qu'il faut qu'un événement se produise pour le voir (e.g. popin). Toujours au
clic, un bouton pour effacer toutes les zones apparaît. Il disparaît quand il
n'y a plus de zone à effacer.

#### Les blocs

Dans certains cas, les liens contextuels (petit engrenage) ne s'affichent pas.
J'ai donc ajouté un lien d'édition [E] du bloc dans une nouvelle fenêtre sans le
paramètre destination.

#### Les vues

Dans certains cas, les liens contextuels (petit engrenage) ne s'affichent pas,
notamment quand on affiche une vue de façon programmatique. J'ai donc ajouté un
lien d'édition [E] de la vue dans une nouvelle fenêtre sans le paramètre
destination.

#### Les nodes

Pour éviter de passer par l'admin menu, j'ai ajouté quatre liens dans une
nouvelle fenêtre vers :

* Afficher le node [V]
* Éditer le node [E]
* Gérer les champs [F]
* Gérer l'affichage [D]

J'affiche ensuite le type du node:NID puis le mode d'affichage 'teaser' s'il
existe car par défaut, Drupal n'intègre que la classe de ce dernier.

J'affiche enfin les propriétés du node :

* P → Promoted
* S → Sticky
* U → Unpublished

#### Les champs

Affichage juste du nom machine et de son type.

#### Les paragraphes

Pour éviter de passer par l'admin menu, j'ai ajouté deux liens dans une
nouvelle fenêtre vers :

* Gérer les champs [F]
* Gérer l'affichage [D]

#### Les médias

Pour éviter de passer par l'admin menu, j'ai ajouté quatre liens dans une
nouvelle fenêtre vers :

* Afficher le média [V]
* Éditer le média [E]
* Gérer les champs [F]
* Gérer l'affichage [D]

#### Troll

Vous verrez que parfois les calques peuvent s'entremêler, se chevaucher ou ne
prennent pas tout l'espace ce qui signifiera que votre intégrateur peut revoir
sa copie...

## ~~Arrière-guichet~~ Back office

Affichage du nom machine et/ou de l'identifiant sans passer par l'inspecteur
d'élément pour l'avoir de suite. Très utile pour faire une recherche rapide ou
l'écrire dans votre code. Affichage de quelques liens pour un accès rapide sans
passer par l'admin menu. Pour plus de lisibilité, leur police est grasse et
verte.

### Structure

#### Blocs

Affichage du `module → nom machine` par bloc.

#### Vocabulaires

Affichage du nom machine et du VID par vocabulaire.

Ajout de liens :

* Gérer les champs
* Gérer l'affichage

#### Termes

Affichage du TID par terme.

#### Types de contenu

Dans l'onglet "Gérer l'affichage" d'un type de contenu, ajout d'un bouton pour
rendre caché tous les labels des champs et d'un bouton pour cacher tous les
champs.

#### Vues

Affichage du nom machine par vue.

#### Gérer les champs

Affichage d'un lien vers le field collection quand nous sommes sur ce dernier.

### Personnes

Affichage de l'identifiant par utilisateur.

#### Permissions

Affichage du nom machine par permission.

#### Rôles

Affichage de l'identifiant par rôle.

### Modules

Affichage du nom machine par module.

### Configuration

#### Traduction d'entité

Ajout d'un bouton pour régler de façon pertinente la configuration :

* Langue par défaut : Langue par défaut
* "Hide language selector" coché
* "Exclude Language neutral from the available languages" coché
* "Hide shared elements on translation forms" coché

#### Facette

Affichage du nom machine par facette.

### Rapports

#### Liste des champs

Le tableau peut être trié par ordre alphabétique selon la colonne. Intéressant
pour savoir combien on a de texte long sur notre site par exemple.

### Bonus track

Ajout d'un surlignement sur les lignes de tableau pour mieux la visualiser.

Je me demande pourquoi ça n'existe pas de base ???

### Astuce

J'ai volontairement écrit d'une certaines façon les noms machine pour optimiser
la recherche dans le code.

Exemples :

* Pour un bloc : `['masquerade']`, vous tomberez directement dans le hook_block_info() respectif
* Pour une vue : `$view->name = 'archive';`, vous tomberez directement dans le hook_views_default_views() respectif

### Bug connu

L'en-tête des tableaux est cassée lors d'un scroll.

## Partout

Ajout d'un title sur les input/textarea/select/option avec leur nom/valeur.
