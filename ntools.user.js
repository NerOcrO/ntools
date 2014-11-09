// ==UserScript==
// @name         NTools
// @author       NerOcrO
// @description  Script who help developers on Drupal 7
// @grant        none
// @include      localhost
// @version      1.0
// ==/UserScript==

/*
 *****************************************************************************
 * Helpers
 *****************************************************************************
 */

nToolsCookie = {
  // Créer/éditer un cookie.
  create: function (name, value, days) {
    if (days) {
      var date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      var expires = '; expires=' + date.toGMTString();
    }
    else {
      var expires = '';
    }
    document.cookie = name + '=' + value + expires + '; path=/';
  },

  // Lire un cookie.
  read: function (name) {
    var nameEQ = name + '=';
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1, c.length);
      }
      if (c.indexOf(nameEQ) == 0) {
        return c.substring(nameEQ.length, c.length);
      }
    }
    return null;
  },

  // Supprimer un cookie.
  erase: function (name) {
    nToolsCookie.create(name, '', -1);
  }
}

String.prototype.capitalize = function () {
  return this.charAt(0).toUpperCase() + this.slice(1);
}

nToolsHelper = {
  // Ajoute une zone transparente sur l'élément voulu.
  addOverlay: function (node, type, output, link1, link2) {
    jQuery(node).append(
      jQuery('<div></div>')
        .addClass('ntools-highlight')
        .append(
          jQuery('<div></div>')
            .addClass('ntools-' + type + '-name')
            .html(output)
            .prepend(link1, ' ', link2, ' ')
        )
        .click(function () {
          nToolsHelper.deleteOverlay(type, this);
        })
    );
  },

  // Supprime une ou plusieurs zones transparentes.
  deleteOverlay: function (type, node) {
    if (typeof node === 'object') {
      var node = jQuery(node).parent();

      if (jQuery('.' + type).find('.ntools-highlight').length === 1) {
        var flag = true;
      }
    }
    else {
      var node = jQuery('.show-' + type),
        flag = true;
    }

    node.find(' > .ntools-highlight').remove();
    node.removeClass('show-' + type);
    if (flag) {
      jQuery('.ntools-' + type + 's-toggle button').html('Show ' + type.capitalize() + 's');
    }

    // Si toutes les zones n'existent plus, on efface le bouton 'Hide all'.
    if (jQuery('.ntools-highlight').length === 0) {
      jQuery('.ntools-hide-all-toggle').remove();
    }
  },

  // Ajoute le bouton "Hide all" qui efface toutes les zones transparentes.
  addhideAllButton: function (type) {
    if (jQuery('.ntools-hide-all-toggle').length === 0) {
      jQuery('body').find('.ntools').append(
        jQuery('<div></div>')
          .addClass('ntools-hide-all-toggle')
          .append(
            jQuery('<button></button>')
              .html('Hide all')
              .click(function () {
                nToolsHelper.deleteOverlay('region');
                nToolsHelper.deleteOverlay('block');
                nToolsHelper.deleteOverlay('view');
                nToolsHelper.deleteOverlay('node');
                nToolsHelper.deleteOverlay('profile');
                nToolsHelper.deleteOverlay('field');
                nToolsHelper.deleteOverlay('form');
              })
          )
      )
    }
  },

  // Ajoute un <td> sur l'élément voulu.
  addTd: function (node, output) {
    jQuery(node).prepend(
      jQuery('<td></td>')
        .addClass('ntools-help')
        .html(output)
    );
  },

  // Ajoute un span sur l'élément voulu.
  addSpan: function (node, selector, output) {
    jQuery(node).find(selector).prepend(
      jQuery('<span></span>')
        .addClass('ntools-help')
        .html(output)
    );
  },

  // Ajoute un lien dans un nouvel onglet.
  addLink: function (href, title, output) {
    return jQuery('<a></a>')
      .attr('href', href)
      .attr('target', '_blank')
      .attr('title', title)
      .html(output);
  },
}

jQuery(function () {
  'use strict';

  var body = jQuery('body').attr('class'),
    pageNode = /page-node-([0-9]+)/.exec(body),
    nodeType = /node-type-(\S+)/.exec(body),
    pageType = /page-type-(\S+)/.exec(body),
    pageTaxonomy = /page-taxonomy-term-([0-9]+)/.exec(body),
    pageUser = /page-user-([0-9]+)/.exec(body),
    bodyClass = '',
    empty = new RegExp(' ', 'g'),
    slash = new RegExp('/', 'g'),
    dash = new RegExp('-', 'g'),
    mum = jQuery('body:not([class*="page-admin"])'),
    css = document.createElement('style'),
    styles = '',
    login = document.getElementsByClassName('logged-in')[0],
    positions = '',
    stylePosition1 = '',
    stylePosition2 = '',
    ntoolsToggle = '',
    thMachineName = jQuery('<th></th>').html('Machine name'),
    myTypes = [
      {
        id: 'region',
        type: 'region',
      },
      {
        id: 'block',
        type: 'block',
      },
      {
        id: 'view',
        type: 'view',
      },
      {
        id: 'node',
        type: 'node',
      },
      {
        id: 'entity-profile2',
        type: 'profile',
      },
      {
        id: 'field',
        type: 'field',
      },
      {
        id: 'form',
        type: 'form',
      },
    ];

  /*
   *****************************************************************************
   * Structure
   *****************************************************************************
   */
  // Ajout de la machine name sur la liste des blocs.
  jQuery('#block-admin-display-form thead tr').prepend(thMachineName);
  jQuery('#block-admin-display-form tbody tr').each(function () {
    var a = jQuery(this).find('a[id*="edit-"]').attr('href'),
      output = '-',
      href = [];

    if (a !== undefined) {
      href = a.split(slash);
      output = href[href.length - 3] + " → ['" + href[href.length - 2] + "']";
    }

    nToolsHelper.addTd(this, output);
  });

  // Ajout du VID sur la liste des vocabulaires.
  jQuery('#taxonomy-overview-vocabularies thead tr').prepend('<th>VID</th>');
  jQuery('#taxonomy-overview-vocabularies tbody tr').each(function () {
    var a = /(.+)\[.+\]/g.exec(jQuery(this).find('select').attr('name'));

    nToolsHelper.addTd(this, a[1]);
  });
  // Ajout de la machine name sur la liste des vocabulaires.
  jQuery('#taxonomy-overview-vocabularies thead tr').prepend(thMachineName);
  jQuery('#taxonomy-overview-vocabularies tbody tr').each(function () {
    var a = jQuery(this).find('a[id*="edit-"]').attr('href').split(slash);

    nToolsHelper.addTd(this, a[a.length - 2]);
  });
  // Ajout des liens "Gérer les champs" et "Gérer l'affichage" sur la liste des vocabulaires.
  jQuery('#taxonomy-overview-vocabularies thead tr').append('<th colspan="2">Operations +</th>');
  jQuery('#taxonomy-overview-vocabularies tbody tr').each(function () {
    var a = jQuery(this).find('a[id*="edit-"]').attr('href').split(slash),
      url = a[a.length - 2],
      aField = jQuery('<a></a>').attr('href', '/admin/structure/taxonomy/' + url + '/fields').html('Manage fields'),
      aDisplay = jQuery('<a></a>').attr('href', '/admin/structure/taxonomy/' + url + '/display').html('Manage display'),
      tdField = jQuery('<td></td>').addClass('ntools-help').html(aField),
      tdDisplay = jQuery('<td></td>').addClass('ntools-help').html(aDisplay);

      jQuery(this).append(tdField).append(tdDisplay);
  });

  // Ajout du TID sur la liste des termes.
  jQuery('#taxonomy-overview-terms thead tr').prepend('<th>TID</th>');
  jQuery('#taxonomy-overview-terms tbody tr').each(function () {
    var a = /:(.+):/.exec(jQuery(this).find('input').attr('name'));

    nToolsHelper.addTd(this, a[1]);
  });

  // Ajout de la machine name sur la liste des vues.
  jQuery('#views-ui-list-page thead tr').prepend(thMachineName);
  jQuery('#views-ui-list-page tbody tr').each(function () {
    var a = jQuery(this).find('.first a').attr('href').split(slash);

    nToolsHelper.addTd(this, '$view->name = \'' + a[a.length - 2] + '\';');
  });

  // Ajout d'un lien vers un field collection sur la liste des champs.
  jQuery('#field-overview tbody tr').each(function () {
    var text = jQuery(this).find('td:nth-child(5)').text();

    if (text === 'Field collection') {
      var field = jQuery(this).find('td:nth-child(4)'),
        textField = field.html();

      field.html('')
        .prepend(
          jQuery('<a></a>')
            .attr('href', '/admin/structure/field-collections/' + textField + '/fields')
            .addClass('ntools-help')
            .html(textField)
        );
    }
  });

  /*
   *****************************************************************************
   * People
   *****************************************************************************
   */
  // Ajout de l'identifiant sur la liste des utilisateurs.
  jQuery('#user-admin-account tbody tr').each(function () {
    var a = /\/user\/(.+)\/edit/.exec(jQuery(this).find('td:last-child a').attr('href'));

    nToolsHelper.addSpan(this, '.username', '(' + a[1] + ') ');
  });

  // Ajout de la machine name sur la liste des permissions.
  jQuery('#user-admin-permissions thead tr').prepend(thMachineName);
  jQuery('#user-admin-permissions tbody tr').each(function () {
    var tableau = /\[(.+)\]/.exec(jQuery(this).find('input').attr('name')),
      output = '-';

    if (tableau !== null) {
      output = "'" + tableau[1] + "'";
    }

    nToolsHelper.addTd(this, output);
  });

  // Ajout de l'identifiant sur la liste des rôles.
  jQuery('#user-roles tbody tr').each(function () {
    var a = /\/admin\/people\/permissions\/(.+)/.exec(jQuery(this).find('td:last-child a').attr('href'));

    if (a !== null) {
      nToolsHelper.addSpan(this, 'td:first-child', '(' + a[1] + ') ');
    }
  });

  /*
   *****************************************************************************
   * Modules
   *****************************************************************************
   */
  // Ajout de la machine name sur la liste des modules.
  jQuery('#system-modules thead tr').prepend(thMachineName);
  jQuery('#system-modules tbody tr').each(function () {
    var tableau = /\[.+\]\[(.+)\]\[.+\]/g.exec(jQuery(this).find('input').attr('name'));

    nToolsHelper.addTd(this, tableau[1]);
  });

  /*
   *****************************************************************************
   * Configuration
   *****************************************************************************
   */
  // Pour les variables, ce n'est pas pérenne.

  /*
   *****************************************************************************
   * Front Office
   *****************************************************************************
   */

  // On lit les dernières positions de la barre d'outils.
  if (nToolsCookie.read('ntools_toggle_positions') !== null) {
    positions = nToolsCookie.read('ntools_toggle_positions').split(':'),
    stylePosition1 = ' style="position:fixed;top:' + positions[0] + 'px;left:' + positions[1] + 'px"',
    stylePosition2 = ' style="position:fixed;top:' + positions[2] + 'px;left:' + positions[1] + 'px"';
  }

  // Bouton pour cacher/montrer/déplacer .ntools au besoin.
  mum.append('<div class="ntools-toggle"' + stylePosition1 + '><button>≡≡≡≡≡≡≡</button></div>');
  ntoolsToggle = jQuery('.ntools-toggle');
  ntoolsToggle.dblclick(function () {
    jQuery('.ntools').slideToggle('fast');
    // Gestion de l'affichage du bloc en fonction du cookie pour éviter de gêner
    // quand on est en édition par exemple.
    if (nToolsCookie.read('ntools_toggle') === 'off') {
      nToolsCookie.create('ntools_toggle', 'on', 30);
    }
    else {
      nToolsCookie.create('ntools_toggle', 'off', 30);
    }
  })
  .mousedown(function (e) {
    window.addEventListener('mousemove', nToolsMove, true);
  })
  .mouseup(function (e) {
    window.removeEventListener('mousemove', nToolsMove, true);
    nToolsCookie.create('ntools_toggle_positions', e.clientY + ':' + parseFloat(e.clientX - 50) + ':' + (parseFloat(e.clientY) + parseFloat(ntoolsToggle.height())), 30);
  });

  mum.append('<div class="ntools"' + stylePosition2 + '></div>');
  // Cachée ou pas selon le cookie.
  if (nToolsCookie.read('ntools_toggle') === 'off') {
    jQuery('.ntools').css('display', 'none');
  }
  else {
    nToolsCookie.create('ntools_toggle', 'on', 30);
  }

  function nToolsMove(e) {
    var ntools = jQuery('.ntools'),
      top1 = e.clientY,
      left1 = e.clientX - 50,
      top2 = parseFloat(top1) + ntoolsToggle.height();

    ntoolsToggle.css({'position': 'fixed', 'top': top1 + 'px', 'left': left1 + 'px'});

    ntools.css({'position': 'fixed', 'top': top2 + 'px', 'left': left1 + 'px'});
  }

  // Affichage du lien pour se connecter avec gestion de la destination.
  if (login === undefined) {
    mum.find('.ntools').append(
      jQuery('<div></div>')
        .addClass('ntools-user')
        .append(
          jQuery('<a></a>')
            .attr('href', '/user?destination=' + window.location.pathname)
            .html('Log in')
        )
    );
  }

  // Affichage du lien pour se déconnecter.
  if (login) {
    mum.find('.ntools').append(
      jQuery('<div></div>')
        .addClass('ntools-user')
        .append(
          jQuery('<a></a>')
            .attr('href', '/user/logout')
            .html('Log out')
        )
    );
  }

  // Affichage des classes intéressantes du body.
  if (pageNode !== null) {
    bodyClass += pageNode[0] + '<br>';
  }
  if (nodeType !== null) {
    bodyClass += nodeType[0] + '<br>';
  }
  if (pageType !== null) {
    bodyClass += pageType[0] + '<br>';
  }
  if (pageTaxonomy !== null) {
    bodyClass += pageTaxonomy[0] + '<br>';
  }
  if (pageUser !== null) {
    bodyClass += pageUser[0] + '<br>';
  }
  if (bodyClass !== '') {
    mum.find('.ntools').append('<div class="ntools-body-class">' + bodyClass + '</div>');
  }

  // Déplacement du bloc Masquerade dans la balise mère.
  mum.find('.ntools').append(jQuery('#block-masquerade-masquerade'));

  // Suppression d'une phrase que je juge inutile.
  jQuery('.description')
    .contents()
    .filter(function () {
      return this.nodeType !== 1;
    })
    .remove();

  // Ajout des rôles sur chaque utilisateur.
  jQuery('#block-masquerade-masquerade #quick_switch_links li').each(function () {
    var a = jQuery(this).find('a'),
      uid = /\/([0-9]+)\?token/.exec(a.attr('href')),
      roles = [];

    if (uid !== null && uid[1] !== '0') {
      jQuery.get(
        '/user/' + uid[1] + '/edit',
        function (data) {
          jQuery('#edit-roles input:checked', data).each(function () {
            roles.push(jQuery('label[for=' + jQuery(this).attr('id') + ']', data).text());
          });

          a.attr('title', roles.join("\r\n"));
        }
      );
    }
  });

  jQuery.each(myTypes, function () {
    if (this.type === 'form') {
      var node = jQuery(this.id),
        type = this.type;
    }
    else {
      var node = jQuery('.' + this.id),
        type = this.type;
    }

    if (node[0] !== undefined) {
      mum.find('.ntools').append(
        jQuery('<div></div>')
          .addClass('ntools-' + type + 's-toggle')
          .append(
            jQuery('<button></button>')
              .html('Show ' + type.capitalize() + 's')
              .click(function () {
                if (jQuery('.show-' + type).length === 0) {
                  jQuery(this).html('Hide ' + type.capitalize() + 's');

                  node.addClass('show-' + type).each(function () {
                    var target = jQuery(this),
                      targetClass = target.attr('class'),
                      targetId = target.attr('id'),
                      classNode = targetClass.split(' '),
                      output = '',
                      link = null,
                      link2 = null;

                    // Un bouton pour mettre en évidence les régions.
                    if (type === 'region') {
                      var classRegion = /region region-([a-z0-9-]+) /.exec(targetClass);

                      output = classRegion[1].replace(dash, '_');
                    }
                    // Un bouton pour mettre en évidence les blocs.
                    else if (type === 'block') {
                      var classBlock = /block block--?([a-z0-9-]+) /.exec(targetClass),
                        nameBlockReg = new RegExp('block-' + classBlock[1] + '-', 'g'),
                        whithoutDash = classBlock[1].replace(dash, '_'),
                        idBlock = targetId.replace(nameBlockReg, '').replace(dash, '_');

                      // Ce lien permet d'éditer le bloc rapidement surtout dans le cas où
                      // le contextual link est absent.
                      if (login) {
                        link = nToolsHelper.addLink('/admin/structure/block/manage/' + whithoutDash + '/' + idBlock + '/configure', 'Edit your block', 'E');
                      };

                      output = whithoutDash + " → ['" + idBlock + "']";
                    }
                    // Un bouton pour mettre en évidence les vues.
                    else if (type === 'view') {
                      var classView = /view view-(\S+)/.exec(targetClass),
                        classIdView = /view-display-id-(\S+)/.exec(targetClass),
                        whithoutDash = classView[1].replace(dash, '_');

                      // Ce lien permet d'éditer la vue rapidement surtout dans le cas où
                      // le contextual link est absent.
                      if (login) {
                        link = nToolsHelper.addLink('/admin/structure/views/view/' + whithoutDash + '/edit/' + classIdView[1], 'Edit your view', 'E');
                      };

                      output = whithoutDash + ' → ' + classIdView[1];
                    }
                    // Un bouton pour mettre en évidence les nodes.
                    else if (type === 'node') {
                      var whithoutDash = classNode[1].replace(dash, '_'),
                        whithoutNode = whithoutDash.replace('node_', '');

                      // Ces liens permettent d'aller rapidement à la liste des champs
                      // ou aux modes d'affichage du node.
                      if (login) {
                        link = nToolsHelper.addLink('/admin/structure/types/manage/' + whithoutNode + '/fields', 'Manage your ' + whithoutNode + ' fields', 'F');
                        link2 = nToolsHelper.addLink('/admin/structure/types/manage/' + whithoutNode + '/display', 'Manage your ' + whithoutNode + ' displays', 'D');
                      }

                      // Les classes potentiellement mises avant le view mode
                      // dont on en a rien à fiche.
                      if (classNode[2] == 'node-promoted' || classNode[2] == 'node-sticky' || classNode[2] == 'node-unpublished') {
                        classNode.splice(2, 1);
                      }

                      output = whithoutDash + ' → ' + classNode[2].replace(dash, '_');
                    }
                    // Un bouton pour mettre en évidence les profiles.
                    else if (type === 'profile') {
                      var whithoutDash = classNode[1].replace(dash, '_'),
                        whithoutProfile = classNode[2].replace(dash, '_').replace('profile2_', '');

                      // Ces liens permettent d'aller rapidement à la liste des champs
                      // ou aux modes d'affichage du profile.
                      if (login) {
                        link = nToolsHelper.addLink('/admin/structure/profiles/manage/' + whithoutProfile + '/fields', 'Manage your ' + whithoutProfile + ' fields', 'F');
                        link2 = nToolsHelper.addLink('/admin/structure/profiles/manage/' + whithoutProfile + '/display', 'Manage your ' + whithoutProfile + ' displays', 'D');
                      }

                      output = whithoutDash + ' → ' + classNode[2].replace(dash, '_');
                    }
                    // Un bouton pour mettre en évidence les fields.
                    else if (type === 'field') {
                      output = classNode[1].replace(dash, '_').replace('field_name_', '') + ' (' + classNode[2].replace(dash, '_');
                    }
                    // Un bouton pour mettre en évidence l'identifiant des formulaires.
                    else if (type === 'form') {
                      output = targetId.replace(dash, '_');
                    }

                    nToolsHelper.addOverlay(this, type, output, link, link2);
                  });

                  nToolsHelper.addhideAllButton();
                }
                else {
                  nToolsHelper.deleteOverlay(type);
                }
              })
          )
      );
    }
  });

  // Autofocus sur le login.
  jQuery('#edit-name').focus();

  // La feuille CSS embarquée.
  styles = (function () {/*
.page-admin table .odd:hover,
.page-admin table .even:hover,
.homebox-column-wrapper table .odd:hover,
.homebox-column-wrapper table .even:hover {
  background-color: #E1E2DC;
}
.ntools-help,
.ntools-help * {
  color: #4D8F46;
  font-weight: 900;
}
.ntools-toggle {
  position: fixed;
  left: 0;
  top: 125px;
  z-index: 900;
}
.ntools-toggle button {
  background: #202020;
  border: none;
  border-radius: 0;
  color: #FFF;
  font-family: Helvetica;
  font-size: 14px;
  margin: 0;
  padding: 2px 5px;
  width: 100px;
}
.ntools {
  background-color: #202020;
  color: #FFF;
  min-width: 105px;
  padding: 5px 5px 0 5px;
  position: fixed;
  left: 0;
  top: 149px;
  z-index: 900;
}
.ntools * {
  font: 400 14px/18px Helvetica;
}
.ntools a {
  color: #0071B3;
}
.ntools a:link,
.ntools a:visited {
  text-decoration: none;
}
.ntools a:hover,
.ntools a:focus {
  color: #018FE2;
}
.ntools > div {
  margin-bottom: 3px;
  padding-bottom: 2px;
}
.ntools-user {
  border-bottom: 1px solid #FFF;
}
.ntools-body-class {
  border-bottom: 1px solid #FFF;
}
#block-masquerade-masquerade h2 {
  display: none;
}
#edit-masquerade-user-field,
#block-masquerade-masquerade input.form-submit {
  border: 1px solid black;
  border-radius: 0;
}
#block-masquerade-masquerade .content,
#block-masquerade-masquerade .form-item {
  margin: 0;
}
.ntools button {
  border: none;
  border-radius: 0;
  color: #FFF;
  cursor: pointer;
  margin: 0;
  padding: 0 5px;
  width: 100%;
}
.ntools-regions-toggle button {
  background: #018FE2;
}
.ntools-regions-toggle button:hover {
  background: #0073B7;
}
.ntools-blocks-toggle button {
  background: #B73939;
}
.ntools-blocks-toggle button:hover {
  background: #9F2B2B;
}
.ntools-views-toggle button {
  background: #FFA300;
}
.ntools-views-toggle button:hover {
  background: #DA900C;
}
.ntools-nodes-toggle button,
.ntools-profiles-toggle button {
  background: #4D8F46;
}
.ntools-nodes-toggle button:hover,
.ntools-profiles-toggle button:hover {
  background: #277D1E;
}
.ntools-fields-toggle button {
  background: #783A00;
}
.ntools-fields-toggle button:hover {
  background: #4E2500;
}
.ntools-forms-toggle button {
  background: #4A3657;
}
.ntools-forms-toggle button:hover {
  background: #3B2549;
}
.ntools-hide-all-toggle button {
  background: #000;
}
.ntools-hide-all-toggle button:hover {
  background: #3B3B3B;
}
.region.show-region,
.block.show-block,
.view.show-view,
.node.show-node,
.profile.show-profile,
.field.show-field,
.form.show-form {
  position: relative;
}
.ntools-highlight {
  background-color: #000;
  cursor: pointer;
  height: 100%;
  left: 0;
  opacity: .7;
  position: absolute;
  top: 0;
  width: 100%;
  z-index: 19;
}
.ntools-highlight div {
  color: #FFF;
  font: 400 14px/18px Helvetica;
  padding: 0 2px;
  position: absolute;
  right: 0;
  text-align: right;
  text-transform: none;
  top: 0;
  width: 100%;
  word-wrap: break-word;
  z-index: 20;
}
.ntools-highlight a[target="_blank"] {
  background: #000;
  color: #FFF;
  padding: 0 4px;
}
.ntools-highlight a[target="_blank"]:hover {
  color: red;
}
.ntools-region-name {
  background-color: #018FE2;
}
.ntools-block-name {
  background-color: #B73939;
}
.ntools-view-name {
  background-color: #FFA300;
}
.ntools-profile-name,
.ntools-node-name {
  background-color: #4D8F46;
}
.ntools-field-name {
  background-color: #783A00;
}
.ntools-form-name {
  background-color: #4A3657;
}*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];

  css.appendChild(document.createTextNode(styles));
  jQuery('head').append(css);
});
