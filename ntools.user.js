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

drupalCookie = {
  // Créer/éditer un cookie.
  create: function(name, value, days) {
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
  read: function(name) {
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
  erase: function(name) {
    drupalCookie.create(name, '', -1);
  }
}

jQuery(function() {
  'use strict';

  var body = jQuery('body').attr('class'),
    mum = 'body:not([class*="page-admin"])',
    empty = new RegExp(' ', 'g'),
    reg = new RegExp('/', 'g'),
    dash = new RegExp('-', 'g'),
    pageNode = /page-node-([0-9]+)/.exec(body),
    nodeType = /node-type-(\S+)/.exec(body),
    pageType = /page-type-(\S+)/.exec(body),
    pageTaxonomy = /page-taxonomy-term-([0-9]+)/.exec(body),
    pageUser = /page-user-([0-9]+)/.exec(body),
    bodyClass = '',
    output = '',
    node = '',
    showOrHideRegion = true,
    showOrHideBlock = true,
    showOrHideView = true,
    showOrHideNode = true,
    showOrHideProfile = true,
    showOrHideField = true,
    showOrHideForm = true,
    css = document.createElement('style'),
    styles = '',
    login = document.getElementsByClassName('logged-in')[0],
    positions = '',
    stylePosition1 = '',
    stylePosition2 = '';

  /*
   *****************************************************************************
   * Structure
   *****************************************************************************
   */
  // Ajout de la machine name sur la liste des blocs.
  jQuery('#block-admin-display-form thead tr').prepend('<th>Machine name</th>');
  jQuery('#block-admin-display-form tbody tr').each(function (index) {
    var a = jQuery('a[id*="edit-"]', this).attr('href'),
      output = '',
      url = '';

    if (a !== undefined) {
      url = a.split(reg);
      output = url[url.length - 3] + " → ['" + url[url.length - 2] + "']";
    }

    jQuery(this).prepend('<td class="ntools-help">' + output + '</td>');
  });

  // Ajout du VID sur la liste des vocabulaires.
  jQuery('#taxonomy-overview-vocabularies thead tr').prepend('<th>VID</th>');
  jQuery('#taxonomy-overview-vocabularies tbody tr').each(function (index) {
    var a = /(.+)\[.+\]/g.exec(jQuery('select', this).attr('name'));

    jQuery(this).prepend('<td class="ntools-help">' + a[1] + '</td>');
  });
  // Ajout de la machine name sur la liste des vocabulaires.
  jQuery('#taxonomy-overview-vocabularies thead tr').prepend('<th>Machine name</th>');
  jQuery('#taxonomy-overview-vocabularies tbody tr').each(function (index) {
    var a = jQuery('a[id*="edit-"]', this).attr('href').split(reg);

    jQuery(this).prepend('<td class="ntools-help">' + a[a.length - 2] + '</td>');
  });
  // Ajout des liens "Gérer les champs" et "Gére l'affichage" sur la liste des vocabulaires.
  jQuery('#taxonomy-overview-vocabularies thead tr').append('<th colspan="2">Operations +</th>');
  jQuery('#taxonomy-overview-vocabularies tbody tr').each(function (index) {
    var a = jQuery('a[id*="edit-"]', this).attr('href').split(reg);

    jQuery(this).append('<td class="ntools-help"><a href="/admin/structure/taxonomy/' + a[a.length - 2] + '/fields">Manage fields</a></td>' +
      '<td class="ntools-help"><a href="/admin/structure/taxonomy/' + a[a.length - 2] + '/display">Manage display</a></td>');
  });

  // Ajout du TID sur la liste des termes.
  jQuery('#taxonomy-overview-terms thead tr').prepend('<th>TID</th>');
  jQuery('#taxonomy-overview-terms tbody tr').each(function (index) {
    var a = /:(.+):/.exec(jQuery('select', this).attr('name'));

    if (a === null) {
      var a = /:(.+):/.exec(jQuery('input', this).attr('name'));
    }

    jQuery(this).prepend('<td class="ntools-help">' + a[1] + '</td>');
  });

  // Ajout de la machine name sur la liste des vues.
  jQuery('#views-ui-list-page thead tr').prepend('<th>Machine name</th>');
  jQuery('#views-ui-list-page tbody tr').each(function (index) {
    var a = jQuery('.first a', this).attr('href').split(reg);

    jQuery(this).prepend('<td class="ntools-help">$view->name = \'' + a[a.length - 2] + '\';</td>');
  });

  // Ajout d'un lien vers un field collection sur la liste des champs.
  jQuery('#field-overview tbody tr').each(function (index) {
    var a = jQuery('td:nth-child(5)', this).text();

    if (a == 'Field collection') {
      var field = jQuery('td:nth-child(4)', this),
        textField = field.text();

      field.text('');
      field.prepend('<a href="/admin/structure/field-collections/' + textField + '/fields">' + textField + '</a>');
    }
  });

  /*
   *****************************************************************************
   * People
   *****************************************************************************
   */
  // Ajout de l'identifiant sur la liste des utilisateurs.
  jQuery('#user-admin-account tr').each(function (index) {
    var a = /\/user\/(.+)\/edit/.exec(jQuery('td:last-child a', this).attr('href'));

    if (a !== null) {
      jQuery('.username', this).after(' <em class="ntools-help">(' + a[1] + ')</em>');
    }
  });

  // Ajout de la machine name sur la liste des permissions.
  jQuery('#user-admin-permissions thead tr').prepend('<th>Machine name</th>');
  jQuery('#user-admin-permissions tbody tr').each(function (index) {
    var tableau = /\[(.+)\]/.exec(jQuery('input', this).attr('name'));

    if (tableau !== null) {
      output = "'" + tableau[1] + "'";
    }

    jQuery(this).prepend('<td class="ntools-help">' + output + '</td>');
  });

  // Ajout de l'identifiant sur la liste des rôles.
  jQuery('#user-roles tr').each(function (index) {
    var a = /\/admin\/people\/permissions\/(.+)/.exec(jQuery('td:last-child a', this).attr('href'));

    if (a !== null) {
      jQuery('td:first-child', this).append(' <em class="ntools-help">(' + a[1] + ')</em>');
    }
  });

  /*
   *****************************************************************************
   * Modules
   *****************************************************************************
   */
  // Ajout de la machine name sur la liste des modules.
  jQuery('#system-modules thead tr').prepend('<th>Machine name</th>');
  jQuery('#system-modules tbody tr').each(function (index) {
    var tableau = /\[.+\]\[(.+)\]\[.+\]/g.exec(jQuery('input', this).attr('name'));

    jQuery(this).prepend('<td class="ntools-help">' + tableau[1] + '</td>');
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
  if (drupalCookie.read('ntools_toggle_positions') !== null) {
    positions = drupalCookie.read('ntools_toggle_positions').split(':'),
    stylePosition1 = ' style="position:fixed;top:' + positions[0] + 'px;left:' + positions[1] + 'px"',
    stylePosition2 = ' style="position:fixed;top:' + positions[2] + 'px;left:' + positions[1] + 'px"';
  }

  // Bouton pour cacher/montrer/déplacer .ntools au besoin.
  jQuery(mum).append('<div class="ntools-toggle"' + stylePosition1 + '><button>≡≡≡≡≡≡≡</button></div>');
  var ntoolsToggle = jQuery('.ntools-toggle');
  ntoolsToggle.dblclick(function () {
    jQuery('.ntools').slideToggle('fast');
    // Gestion de l'affichage du bloc en fonction du cookie pour éviter de gêner
    // quand on est en édition par exemple.
    if (drupalCookie.read('ntools_toggle') === 'off') {
      drupalCookie.create('ntools_toggle', 'on', 30);
    }
    else {
      drupalCookie.create('ntools_toggle', 'off', 30);
    }
  })
  .mousedown(function (e) {
    window.addEventListener('mousemove', nToolsMove, true);
  }, false)
  .mouseup(function (e) {
    window.removeEventListener('mousemove', nToolsMove, true);
    drupalCookie.create('ntools_toggle_positions', e.clientY + ':' + parseFloat(e.clientX - 50) + ':' + (parseFloat(e.clientY) + parseFloat(ntoolsToggle.height())), 30);
  }, false);

  // Balise mère.
  jQuery(mum).append('<div class="ntools"' + stylePosition2 + '></div>');
  // Cachée ou pas selon le cookie.
  if (drupalCookie.read('ntools_toggle') === 'off') {
    jQuery('.ntools').css('display', 'none');
  }
  else {
    drupalCookie.create('ntools_toggle', 'on', 30);
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
    jQuery(mum + ' .ntools').append('<div class="ntools-user"><a href="/user?destination=' + window.location.pathname + '">Log in</a></div>');
  }

  // Affichage du lien pour se déconnecter.
  if (login) {
    jQuery(mum + ' .ntools').append('<div class="ntools-user"><a href="/user/logout">Log out</a></div>');
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
    jQuery(mum + ' .ntools').append('<div class="ntools-body-class">' + bodyClass + '</div>');
  }

  // Déplacement du bloc Masquerade dans la balise mère.
  jQuery(mum + ' .ntools').append(jQuery('#block-masquerade-masquerade'));

  // Suppression d'une phrase que je juge inutile.
  jQuery('.description')
    .contents()
    .filter(function() {
      return this.nodeType !== 1;
    })
    .remove();

  // Ajout des rôles sur chaque utilisateur.
  jQuery('#block-masquerade-masquerade #quick_switch_links li').each(function (index) {
    var a = jQuery('a', this),
      uid = /\/([0-9]+)\?token/.exec(a.attr('href')),
      roles = [];

    if (uid !== null && uid[1] !== '0') {
      jQuery.get(
        '/user/' + uid[1] + '/edit',
        function (data) {
          jQuery('#edit-roles input:checked', data).each(function (index) {
            roles.push(jQuery('label[for=' + jQuery(this).attr('id') + ']', data).text());
          });

          a.attr('title', roles.join("\r\n"));
        }
      );
    }
  });

  // Un bouton pour mettre en évidence les régions.
  if (jQuery('.region')[0] !== undefined) {
    jQuery(mum + ' .ntools').append('<div class="ntools-regions-toggle"><button>Show Regions</button></div>');
    jQuery('.ntools-regions-toggle button').click(function () {
      if (showOrHideRegion === true) {
        showOrHideRegion = false;
        jQuery('.ntools-regions-toggle button').html('Hide Regions');
        jQuery('.region').addClass('show-region').each(function (index) {
          var classRegion = /region region-([a-z0-9-]+) /.exec(jQuery(this).attr('class')),
            nameRegionReg = new RegExp('region-' + classRegion[1] + '-', 'g');

          output = classRegion[1].replace(dash, '_');

          jQuery(this).append('<div class="ntools-highlight"><div class="ntools-region-name">' + output + '</div></div>');
        });
      }
      else if (showOrHideRegion === false) {
        jQuery('.show-region > .ntools-highlight').remove();
        jQuery('.region').removeClass('show-region');
        jQuery('.ntools-regions-toggle button').html('Show Regions');
        showOrHideRegion = true;
      }
    });
  }

  // Un bouton pour mettre en évidence les blocs.
  if (jQuery('.block')[0] !== undefined) {
    jQuery(mum + ' .ntools').append('<div class="ntools-blocks-toggle"><button>Show Blocks</button></div>');
    jQuery('.ntools-blocks-toggle button').click(function () {
      if (showOrHideBlock === true) {
        showOrHideBlock = false;
        jQuery('.ntools-blocks-toggle button').html('Hide Blocks');
        jQuery('.block').addClass('show-block').each(function (index) {
          var classBlock = /block block--?([a-z0-9-]+) /.exec(jQuery(this).attr('class')),
            nameBlockReg = new RegExp('block-' + classBlock[1] + '-', 'g');

          output = classBlock[1].replace(dash, '_') + " → ['" + jQuery(this).attr('id').replace(nameBlockReg, '').replace(dash, '_') + "']";

          jQuery(this).append('<div class="ntools-highlight"><div class="ntools-block-name">' + output + '</div></div>');
        });
      }
      else if (showOrHideBlock === false) {
        jQuery('.show-block > .ntools-highlight').remove();
        jQuery('.block').removeClass('show-block');
        jQuery('.ntools-blocks-toggle button').html('Show Blocks');
        showOrHideBlock = true;
      }
    });
  }

  // Un bouton pour mettre en évidence les vues.
  if (jQuery('.view')[0] !== undefined) {
    jQuery(mum + ' .ntools').append('<div class="ntools-views-toggle"><button>Show Views</button></div>');
    jQuery('.ntools-views-toggle button').click(function () {
      if (showOrHideView === true) {
        showOrHideView = false;
        jQuery('.ntools-views-toggle button').html('Hide Views');
        jQuery('.view').addClass('show-view').each(function (index) {
          var classView = /view view-(\S+)/.exec(jQuery(this).attr('class')),
            classIdView = /view-display-id-(\S+)/.exec(jQuery(this).attr('class')),
            link = '';

          // Ce lien permet d'éditer la vue rapidement surtout dans le cas où
          // le contextual link est absent.
          if (login) {
            link = '<a href="/admin/structure/views/view/' + classView[1].replace(dash, '_') + '/edit/' + classIdView[1] + '" target="_blank" title="Edit your view">E</a> ';
          };

          jQuery(this).append('<div class="ntools-highlight"><div class="ntools-view-name">' + link +
            classView[1].replace(dash, '_') + ' → ' + classIdView[1] + '</div></div>');
        });
      }
      else if (showOrHideView === false) {
        jQuery('.show-view > .ntools-highlight').remove();
        jQuery('.view').removeClass('show-view');
        jQuery('.ntools-views-toggle button').html('Show Views');
        showOrHideView = true;
      }
    });
  }

  // Un bouton pour mettre en évidence les nodes.
  if (jQuery('.node')[0] !== undefined) {
    jQuery(mum + ' .ntools').append('<div class="ntools-nodes-toggle"><button>Show Nodes</button></div>');
    jQuery('.ntools-nodes-toggle button').click(function () {
      if (showOrHideNode === true) {
        showOrHideNode = false;
        jQuery('.ntools-nodes-toggle button').html('Hide Nodes');
        jQuery('.node').addClass('show-node').each(function (index) {
          var classNode = jQuery(this).attr('class').split(' '),
            whithoutDash = classNode[1].replace(dash, '_'),
            whithoutNode = whithoutDash.replace('node_', ''),
            link = '';

          // Ces liens permettent d'aller rapidement à la liste des champs
          // ou aux modes d'affichage du node.
          if (login) {
            link = '<a href="/admin/structure/types/manage/' + whithoutNode + '/fields" target="_blank" title="Manage your ' + whithoutNode + ' fields">F</a> ' +
              '<a href="/admin/structure/types/manage/' + whithoutNode + '/display" target="_blank" title="Manage your ' + whithoutNode + ' displays">D</a> ';
          }

          // Les classes potentiellement mises avant le view mode
          // dont on en a rien à fiche.
          if (classNode[2] == 'node-promoted' || classNode[2] == 'node-sticky' || classNode[2] == 'node-unpublished') {
            classNode.splice(2, 1);
          }

          jQuery(this).append('<div class="ntools-highlight"><div class="ntools-node-name">' + link + whithoutDash + ' → ' + classNode[2].replace(dash, '_') + '</div></div>');
        });
      }
      else if (showOrHideNode === false) {
        jQuery('.show-node > .ntools-highlight').remove();
        jQuery('.node').removeClass('show-node');
        jQuery('.ntools-nodes-toggle button').html('Show Nodes');
        showOrHideNode = true;
      }
    });
  }

  // Un bouton pour mettre en évidence les profiles.
  if (jQuery('.entity-profile2')[0] !== undefined) {
    jQuery(mum + ' .ntools').append('<div class="ntools-profiles-toggle"><button>Show Profiles</button></div>');
    jQuery('.ntools-profiles-toggle button').click(function () {
      if (showOrHideProfile === true) {
        showOrHideProfile = false;
        jQuery('.ntools-profiles-toggle button').html('Hide Profiles');
        jQuery('.entity-profile2').addClass('show-profile').each(function (index) {
          var classProfile = jQuery(this).attr('class').split(' '),
            whithoutDash = classProfile[1].replace(dash, '_'),
            whithoutProfile = classProfile[2].replace(dash, '_').replace('profile2_', ''),
            link = '';

          // Ces liens permettent d'aller rapidement à la liste des champs
          // ou aux modes d'affichage du profile.
          if (login) {
            link = '<a href="/admin/structure/profiles/manage/' + whithoutProfile + '/fields" target="_blank" title="Manage your ' + whithoutProfile + ' fields">F</a> ' +
              '<a href="/admin/structure/profiles/manage/' + whithoutProfile + '/display" target="_blank" title="Manage your ' + whithoutProfile + ' displays">D</a> ';
          }

          jQuery(this).append('<div class="ntools-highlight"><div class="ntools-profile-name">' + link + whithoutDash + ' → ' + classProfile[2].replace(dash, '_') + '</div></div>');
        });
      }
      else if (showOrHideProfile === false) {
        jQuery('.show-profile > .ntools-highlight').remove();
        jQuery('.entity-profile2').removeClass('show-profile');
        jQuery('.ntools-profiles-toggle button').html('Show Profiles');
        showOrHideProfile = true;
      }
    });
  }

  // Un bouton pour mettre en évidence les fields.
  if (jQuery('.field')[0] !== undefined) {
    jQuery(mum + ' .ntools').append('<div class="ntools-fields-toggle"><button>Show Fields</button></div>');
    jQuery('.ntools-fields-toggle button').click(function () {
      if (showOrHideField === true) {
        showOrHideField = false;
        jQuery('.ntools-fields-toggle button').html('Hide Fields');
        jQuery('.field').addClass('show-field').each(function (index) {
          var classfield = jQuery(this).attr('class').split(' ');

          jQuery(this).append('<div class="ntools-highlight"><div class="ntools-field-name">' + classfield[1].replace(dash, '_').replace('field_name_', '') + ' (' + classfield[2].replace(dash, '_') + ')</div></div>');
        });
      }
      else if (showOrHideField === false) {
        jQuery('.show-field > .ntools-highlight').remove();
        jQuery('.field').removeClass('show-field');
        jQuery('.ntools-fields-toggle button').html('Show Fields');
        showOrHideField = true;
      }
    });
  }

  // Un bouton pour mettre en évidence l'identifiant des formulaires.
  node = jQuery('form');
  if (node[0] !== undefined) {
    jQuery(mum + ' .ntools').append('<div class="ntools-forms-toggle"><button>Show Forms ID</button></div>');
    jQuery('.ntools-forms-toggle button').click(function () {
      if (showOrHideForm === true) {
        showOrHideForm = false;
        jQuery('.ntools-forms-toggle button').html('Hide Forms ID');
        node.addClass('show-form').each(function (index) {
          jQuery(this).append('<div class="ntools-highlight"><div class="ntools-form-name">' + jQuery(this).attr('id').replace(dash, '_') + '</div></div>');
        });
      }
      else if (showOrHideForm === false) {
        jQuery('.show-form > .ntools-highlight').remove();
        node.removeClass('show-form');
        jQuery('.ntools-forms-toggle button').html('Show Forms ID');
        showOrHideForm = true;
      }
    });
  }

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
