// ==UserScript==
// @name         NTools
// @author       NerOcrO
// @description  Script who help developers on Drupal 7/8
// @grant        none
// @require      https://code.jquery.com/jquery-3.2.1.min.js
// @include      localhost
// @version      5.0
// ==/UserScript==

(function init($, Drupal, drupalSettings) {
  if (typeof unsafeWindow !== 'undefined') {
    Drupal = unsafeWindow.Drupal;
    drupalSettings = unsafeWindow.drupalSettings;
  }

  const nToolsCookie = {
    // Créer/éditer un cookie.
    create(name, value, days = 365) {
      let expires = '';

      if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = `; expires=${date.toGMTString()}`;
      }

      document.cookie = `${name}=${value}${expires}; path=/`;
    },

    // Lire un cookie.
    read(name) {
      const nameEQ = `${name}=`;
      const ca = document.cookie.split(';');

      for (let i = 0; i < ca.length; i += 1) {
        let c = ca[i];
        while (c.charAt(0) === ' ') {
          c = c.substring(1, c.length);
        }
        if (c.indexOf(nameEQ) === 0) {
          return c.substring(nameEQ.length, c.length);
        }
      }
      return null;
    },

    // Supprimer un cookie.
    erase(name) {
      nToolsCookie.create(name, '', -1);
    },
  };

  const nToolsHelper = {
    // Mise en majuscule de la première lettre.
    capitalize(text) {
      return text.charAt(0).toUpperCase() + text.slice(1);
    },

    // Compare two elements.
    compare(index) {
      return (a, b) => {
        const valA = $(a).children('td').eq(index).html();
        const valB = $(b).children('td').eq(index).html();
        return !Number.isNaN(parseFloat(valA)) && !Number.isNaN(parseFloat(valB)) ? valA - valB : valA.localeCompare(valB);
      };
    },

    // Configure de façon pertinente la traduction des entités.
    configuringEntityTranslation() {
      $('#entity-translation-admin-form fieldset').each((index, element) => {
        $('select option[value="xx-et-default"]', element).attr('selected', true);
        $('input[id*="-hide-language-selector"]', element).prop('checked', true);
        $('input[id*="-exclude-language-none"]', element).prop('checked', true);
        $('input[id*="-shared-fields-original-only"]', element).prop('checked', true);
      });
    },

    // Met à <hidden> toutes les étiquettes des champs dans "Gérer l'affichage".
    hideAllField() {
      const $overview = $('#field-display-overview');
      const $button = $('<button></button>')
        .html('Hide all')
        .addClass('ntools-hidden')
        .click(() => {
          $('tbody td:nth-last-child(4) select option[value="hidden"]', $overview).each((index, element) => {
            element.selected = true;
          });

          return false;
        });

      $('th:nth-last-child(2)', $overview).append($button);
      if ($overview.length === 1) {
        $('.sticky-header th:nth-last-child(2)').append($button.clone(true));
      }
    },

    // Retire tous les champs dans "Gérer l'affichage".
    removeAllField() {
      let $select = $('#field-display-overview select.field-region');

      // Drupal 8.3 intègre un nouveau select (région) qui désactive maintenant
      // le champ.
      if (!$select.length) {
        $select = $('#field-display-overview tbody td:nth-last-child(3) select');
      }

      const $button = $('<button></button>')
        .html('Disable all')
        .addClass('ntools-hidden')
        .click(() => {
          $('option[value="hidden"]', $select).each((index, element) => {
            element.selected = true;
          });

          // Déclenche le call AJAX pour le 1er élément, déclenchant les autres.
          $select.first().trigger('change');
        });
      $('#field-display-overview thead th:nth-last-child(1)').append($button);
      if ($select.length >= 1) {
        $('.sticky-header th:nth-last-child(1)').append($button.clone(true));
      }
    },

    // Ajoute une zone transparente sur l'élément voulu.
    addOverlay(node, type, output, links) {
      const $nameLinks = $('<span></span>').addClass('ntools-links');
      const $divChild = $('<div></div>')
        .addClass(`ntools-${type}-name`)
        .html(output)
        .prepend($nameLinks)
        .click((eventObject) => {
          eventObject.stopPropagation();
        });
      const $div = $('<div></div>')
        .addClass('ntools-highlight')
        .append($divChild)
        .click((eventObject) => {
          nToolsHelper.deleteOverlay(type, eventObject.currentTarget);
        });

      for (let i = 0; i < links.length; i += 1) {
        $nameLinks.append(links[i]);
      }

      $(node).append($div);
    },

    // Supprime une ou plusieurs zones transparentes.
    deleteOverlay(type, element) {
      let flag = false;
      let $parent = {};

      if (typeof element === 'object') {
        $parent = $(element).parent();
        flag = $(`.${type} .ntools-highlight`).length === 1;
      }
      else {
        $parent = $(`.show-${type}`);
        flag = true;
      }

      $(' > .ntools-highlight', $parent).remove();
      $parent.removeClass(`ntools-show show-${type}`);
      if (flag) {
        $(`.ntools-${type}s-toggle`).html(`Show ${nToolsHelper.capitalize(type)}s`);
      }

      // Si toutes les zones n'existent plus, on efface le bouton "Hide all".
      if ($('.ntools-highlight').length === 0) {
        $('.ntools-hide-all-toggle').remove();
      }
    },

    // Ajoute le bouton "Hide all" qui efface toutes les zones transparentes.
    addhideAllButton() {
      if ($('.ntools-hide-all-toggle').length !== 0) {
        return;
      }

      const $button = $('<button></button>')
        .html('Hide all')
        .addClass('ntools-hide-all-toggle')
        .click(() => {
          nToolsHelper.deleteOverlay('region');
          nToolsHelper.deleteOverlay('block');
          nToolsHelper.deleteOverlay('view');
          nToolsHelper.deleteOverlay('node');
          nToolsHelper.deleteOverlay('profile');
          nToolsHelper.deleteOverlay('field');
          nToolsHelper.deleteOverlay('paragraph');
          nToolsHelper.deleteOverlay('media');
          nToolsHelper.deleteOverlay('form');
        });

      $('body .ntools').append($button);
    },

    // Ajoute un <td> sur l'élément voulu.
    addTd(node, output) {
      const $td = $('<td></td>')
        .addClass('ntools-help')
        .html(output);

      $(node).prepend($td);
    },

    // Crée un <th>.
    createTh(output = 'Machine name', colspan = 1, classs = '') {
      return $('<th></th>')
        .attr('colspan', colspan)
        .addClass(classs)
        .html(output);
    },

    // Crée un lien qui pointe vers un nouvel onglet.
    createLink(href, title, output) {
      return $('<a></a>')
        .attr('href', href)
        .attr('target', '_blank')
        .attr('title', title)
        .html(output)
        .click((eventObject) => {
          eventObject.stopPropagation();
        });
    },

    // Ajoute une information utile comme un identifiant, un nom machine...
    // dans une table.
    addHelp(selector, target, thName = 'Machine name', prefix = '', suffix = '') {
      const slash = new RegExp('/', 'g');
      let output = '';

      $('table thead tr')
        .prepend(nToolsHelper.createTh(thName));
      $('table tbody tr')
        .each((index, element) => {
          let url = $(selector, element);
          let urlSplit = '';

          if (url[0] !== undefined) {
            url = url.attr('href').split('?destination');
            urlSplit = url[0].split(slash);

            output = prefix + urlSplit[urlSplit.length - target] + suffix;
          }
          else {
            output = '-';
          }

          nToolsHelper.addTd(element, output);
        });
    },

    // Order added on field's list table.
    addReportsOrder(eventObject) {
      const element = eventObject.currentTarget;
      const $table = $(element).parents('table');
      const rows = $('tr:gt(0)', $table).toArray().sort(nToolsHelper.compare($(element).index()));

      $('th', $table).removeClass().addClass('filter');
      $(element).addClass('active');
      element.asc = !element.asc;

      if (!element.asc) {
        rows.reverse();
      }

      for (let i = 0; i < rows.length; i += 1) {
        $table.append(rows[i]);
      }
    },

    removeDropButton() {
      // Not for Views.
      if ($('form').attr('data-drupal-form-fields')) {
        return;
      }

      $('.dropbutton-wrapper')
        .removeClass()
        .find('.dropbutton-widget')
        .removeClass()
        .find('.dropbutton')
        .removeClass()
        .find('.dropbutton-toggle')
        .remove();
    },
  };

  const nTools = {
    highlightTitle() {
      // Ajout d'un title avec name/value sur input/textarea/select.
      $('input, textarea, select').each((index, element) => {
        const $input = $(element);
        let output = `Name: ${$input.attr('name')}`;

        if ($input.attr('type') === 'checkbox' || $input.attr('type') === 'radio') {
          output += `\nValue: ${$input.val()}`;
        }

        $input.attr('title', output);
      });

      // Toutes les <option> ont un title avec leur valeur.
      $('option').each((index, element) => {
        const $input = $(element);
        $input.attr('title', `Value: ${$input.val()}`);
      });
    },

    backOfficeD8() {
      const pathname = drupalSettings.path.currentPath;

      /*
       *****************************************************************************
       * Content
       *****************************************************************************
       */
      if (pathname === 'admin/content') {
        // NID added on content list.
        nToolsHelper.addHelp('.edit a', 2, 'NID');
      }
      else if (pathname === 'admin/content/files') {
        // FID added on file list.
        nToolsHelper.addHelp('.views-field-count a', 1, 'FID');
      }
      else if (pathname === 'admin/content/media') {
        // FID added on media list.
        nToolsHelper.addHelp('.edit a', 2, 'MID');
      }
      /*
       *****************************************************************************
       * Structure
       *****************************************************************************
       */
      // else if (pathname === 'admin/structure/block') {
      //   // Machine name added on blocks list.
      //   $('[data-drupal-selector="edit-blocks"] thead tr')
      //     .prepend(nToolsHelper.createTh('base_block_id'));
      //   $('[data-drupal-selector="edit-blocks"] tbody tr')
      //     .each((index, element) => {
      //       const $tr = $(element);
      //       const draggable = $tr.is('.draggable');
      //       let output = '-';

      //       if (draggable) {
      //         // const selector = /edit-blocks-[a-z]+-(.+)/g.exec($tr.attr('data-drupal-selector'));
      //         // output = 'id = "' + $tr.find('td:nth-child(2)').html().toLowerCase() + '_' + selector[1] + '_block"';
      //         // En attente de : https://www.drupal.org/node/2641862
      //         output = 'id&nbsp;=&nbsp;"' + $tr.attr('data-drupal-plugin-id') + '"';
      //       }

      //       nToolsHelper.addTd(element, output);
      //     });
      // }
      else if (pathname === 'admin/structure/types') {
        // Machine name added on content type list.
        nToolsHelper.addHelp('.manage-fields a', 2);
      }
      else if (pathname === 'admin/structure/display-modes/form') {
        // Machine name added on display modes form list.
        nToolsHelper.addHelp('.edit a', 1);
      }
      else if (pathname === 'admin/structure/display-modes/view') {
        // Machine name added on display modes view list.
        nToolsHelper.addHelp('.edit a', 1);
      }
      else if (pathname === 'admin/structure/menu') {
        // Machine name added on menu list.
        nToolsHelper.addHelp('.edit a', 1);
      }
      else if (pathname === 'admin/structure/taxonomy') {
        // Machine name added on vocabularies list.
        nToolsHelper.addHelp('.list a', 2);
      }
      else if (
        pathname.substring(0, 31) === 'admin/structure/taxonomy/manage'
        && (/admin\/structure\/taxonomy\/manage\/(.+)\/overview\/(.+)/g).exec(pathname) === null
      ) {
        // TID added on terms list.
        nToolsHelper.addHelp('.edit a', 2, 'TID');
      }
      else if (pathname === 'admin/structure/views') {
        // Machine name added on menu list.
        nToolsHelper.addHelp('.edit a', 1, '', 'id:&nbsp;');
      }

      /*
       *****************************************************************************
       * People
       *****************************************************************************
       */
      else if (pathname === 'admin/people') {
        // UID added on users list.
        nToolsHelper.addHelp('.edit a', 2, 'UID');
      }
      else if (pathname === 'admin/people/permissions') {
        // Machine name added on permissions list.
        $('[data-drupal-selector="permissions"] thead tr')
          .prepend(nToolsHelper.createTh());
        $('[data-drupal-selector="permissions"] tbody tr')
          .each((index, element) => {
            const tableau = /\[(.+)\]/.exec($('input', element).attr('name'));
            const output = tableau !== null ? tableau[1] : '-';

            nToolsHelper.addTd(element, output);
          });
      }
      else if (pathname === 'admin/people/roles') {
        // Machine name added on roles list.
        nToolsHelper.addHelp('.edit a', 1);
      }

      /*
       *****************************************************************************
       * Modules
       *****************************************************************************
       */
      else if (pathname === 'admin/modules') {
        // Machine name added on modules list.
        $('[data-drupal-selector="system-modules"] thead tr')
          .prepend(nToolsHelper.createTh('Machine name', 1, 'visually-hidden'));
        $('[data-drupal-selector="system-modules"] tbody tr')
          .each((index, element) => {
            const output = /.+\[(.+)\]\[.+\]/g.exec($('input', element).attr('name'));

            nToolsHelper.addTd(element, output[1]);
          });
      }

      /*
       *****************************************************************************
       * Reports
       *****************************************************************************
       */
      else if (pathname === 'admin/reports/fields') {
        $('table th')
          .click(nToolsHelper.addReportsOrder)
          .addClass('filter');
      }

      /*
       *****************************************************************************
       * Other
       *****************************************************************************
       */
      // Button added to hide all field's label.
      nToolsHelper.hideAllField();
      // Button added to remove fields from display.
      nToolsHelper.removeAllField();

      nToolsHelper.removeDropButton();
    },

    backOfficeD7() {
      const slash = new RegExp('/', 'g');
      const pathname = window.location.pathname.replace(Drupal.settings.pathPrefix, '');

      /*
       *****************************************************************************
       * Content
       *****************************************************************************
       */
      if (pathname === '/admin/content') {
        // Ajout de l'identifiant sur la liste des nodes.
        nToolsHelper.addHelp('td:last-child a', 2, 'NID');
      }

      /*
       *****************************************************************************
       * Structure
       *****************************************************************************
       */
      else if (pathname === '/admin/structure/block') {
        // Ajout de la machine name sur la liste des blocs.
        $('table thead tr')
          .prepend(nToolsHelper.createTh());
        $('table tbody tr')
          .each((index, element) => {
            const a = $('a[id*="edit-"]', element).attr('href');
            let output = '-';
            let href = [];

            if (a !== undefined) {
              href = a.split(slash);
              output = `${href[href.length - 3]} → ["${href[href.length - 2]}"]`;
            }

            nToolsHelper.addTd(element, output);
          });
      }
      else if (pathname === '/admin/structure/taxonomy') {
        // Ajout du VID sur la liste des vocabulaires.
        $('table thead tr')
          .prepend(nToolsHelper.createTh('VID'));
        $('table tbody tr')
          .each((index, element) => {
            const a = /(.+)\[.+\]/g.exec($('select', element).attr('name'));

            nToolsHelper.addTd(element, a[1]);
          });
        // Ajout de la machine name sur la liste des vocabulaires.
        nToolsHelper.addHelp('td:last-child a', 2);
        // Ajout des liens "Gérer les champs" et "Gérer l'affichage" sur la liste des vocabulaires.
        $('table thead tr')
          .append(nToolsHelper.createTh('Operations +', 2));
        $('table tbody tr')
          .each((index, element) => {
            const a = $('td:last-child a', element).attr('href').split(slash);
            const url = a[a.length - 2];
            const aField = $('<a></a>').attr('href', `/admin/structure/taxonomy/${url}/fields`).html('Manage fields');
            const aDisplay = $('<a></a>').attr('href', `/admin/structure/taxonomy/${url}/display`).html('Manage display');
            const tdField = $('<td></td>').addClass('ntools-help').html(aField);
            const tdDisplay = $('<td></td>').addClass('ntools-help').html(aDisplay);

            $(element).append(tdField).append(tdDisplay);
          });
      }
      else if (
        pathname.substring(0, 26) === '/admin/structure/taxonomy/'
        && (/\/admin\/structure\/taxonomy\/(.+)\/(.+)/g).exec(pathname) === null
      ) {
        // Ajout du TID sur la liste des termes.
        nToolsHelper.addHelp('td:last-child a', 2, 'TID');
      }
      else if (pathname === '/admin/structure/views') {
        // Ajout de la machine name sur la liste des vues.
        nToolsHelper.addHelp('.first a', 2, '', '$view->name = "', '";');
      }

      /*
       *****************************************************************************
       * People
       *****************************************************************************
       */
      else if (pathname === '/admin/people') {
        // Ajout de l'identifiant sur la liste des utilisateurs.
        nToolsHelper.addHelp('td:last-child a', 2, 'UID');
      }
      else if (
        pathname === '/admin/people/permissions'
        || (/\/admin\/config\/group\/permissions\/(.+)\/(.+)/g).exec(pathname) !== null
      ) {
        // Ajout de la machine name sur la liste des permissions.
        $('table thead tr')
          .prepend(nToolsHelper.createTh());
        $('table tbody tr')
          .each((index, element) => {
            const tableau = /\[(.+)\]/.exec($('input', element).attr('name'));
            let output = '-';

            if (tableau !== null) {
              output = `"${tableau[1]}"`;
            }

            nToolsHelper.addTd(element, output);
          });
      }
      else if (pathname === '/admin/people/permissions/roles') {
        // Ajout de l'identifiant sur la liste des rôles.
        nToolsHelper.addHelp('td:last-child a', 1, 'RID');
      }

      /*
       *****************************************************************************
       * Modules
       *****************************************************************************
       */
      else if (pathname === '/admin/modules') {
        // Ajout de la machine name sur la liste des modules.
        $('table thead tr')
          .prepend(nToolsHelper.createTh());
        $('table tbody tr')
          .each((index, element) => {
            const output = /\[.+\]\[(.+)\]\[.+\]/g.exec($('input', element).attr('name'));
            nToolsHelper.addTd(element, output[1]);
          });
      }

      /*
       *****************************************************************************
       * Configuration
       *****************************************************************************
       */
      else if (pathname === '/admin/config/regional/entity_translation') {
        const $button = $('<button></button>')
          .html('Configuring')
          .addClass('ntools-hidden')
          .click(() => {
            nToolsHelper.configuringEntityTranslation();
            return false;
          });
        // Ajout d'un bouton pour configurer de façon pertinente
        // la traduction des entités.
        $('#entity-translation-admin-form #edit-actions').append($button);
      }
      else if (pathname === '/admin/config/search/apachesolr/settings/solr/facets') {
        // Ajout de la machine name sur la liste des facettes.
        nToolsHelper.addHelp('.first a', 2);
      }

      /*
       *****************************************************************************
       * Reports
       *****************************************************************************
       */
      else if (pathname === '/admin/reports/fields') {
        // Le tableau de la liste des champs peu être trié.
        $('.page-admin-reports-fields .sticky-enabled th')
          .click(nToolsHelper.addReportsOrder)
          .addClass('filter');
      }

      /*
       *****************************************************************************
       * Other
       *****************************************************************************
       */
      // Button added to hide all field's label.
      nToolsHelper.hideAllField();
      // Button added to remove fields from display.
      nToolsHelper.removeAllField();

      // Ajout d'un lien vers un field collection sur la liste des champs.
      $('#field-overview tbody tr').each((index, element) => {
        const text = $('td:nth-child(5)', element).text();

        if (text === 'Field collection') {
          const $field = $('td:nth-child(4)', element);
          const textField = $field.html();
          const link = $('<a></a>').attr('href', `/admin/structure/field-collections/${textField}/fields`).addClass('ntools-help').html(textField);

          $field.html('').prepend(link);
        }
      });
    },

    nToolsMove(e) {
      const $ntools = $('.ntools');
      const $divNtoolsToggle = $('.ntools-toggle');
      const top1 = e.clientY;
      const left1 = e.clientX - 50;
      const top2 = parseFloat(top1) + $divNtoolsToggle.height();

      $divNtoolsToggle.css({
        position: 'fixed',
        top: `${top1}px`,
        left: `${left1}px`,
      });

      $ntools.css({
        position: 'fixed',
        top: `${top2}px`,
        left: `${left1}px`,
      });
    },

    toolbar() {
      const $body = $('body');
      const bodyClasses = $body.attr('class');
      const pageNode = /page-node-([0-9]+)/.exec(bodyClasses);
      const nodeType = /node-type-(\S+)/.exec(bodyClasses);
      const pageType = /page-type-(\S+)/.exec(bodyClasses);
      const pageTaxonomy = /page-taxonomy-term-([0-9]+)/.exec(bodyClasses);
      const pageUser = /page-user-([0-9]+)/.exec(bodyClasses);
      const pageContext = bodyClasses.match(/context-(\S+)/g);
      const dash = new RegExp('-', 'g');
      const login = $('.logged-in, .user-logged-in').length;
      const $masquerade = $('#block-masquerade-masquerade');
      const $div = $('<div></div>').addClass('ntools-user');
      const $link = $('<a></a>');
      const $buttonNtoolsToggle = $('<button></button>').html('≡≡≡≡≡≡≡');
      const $divNtoolsToggle = $('<div></div>').addClass('ntools-toggle');
      const $divNtools = $('<div></div>').addClass('ntools');
      const $divNtoolsBodyClass = $('<div></div>').addClass('ntools-body-class');
      const myTypes = [
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
          id: 'paragraph',
          type: 'paragraph',
        },
        {
          id: 'media',
          type: 'media',
        },
        {
          id: 'form',
          type: 'form',
        },
      ];
      let $button = {};
      let bodyClass = '';
      let positions = '';
      let pathPrefix = '';
      let loginText = 'Log out';
      let loginUrl = '/user/logout';

      // On lit les dernières positions de la barre d'outils.
      if (nToolsCookie.read('ntools_toggle_positions') !== null) {
        positions = nToolsCookie.read('ntools_toggle_positions').split(':');
        $divNtoolsToggle.css({
          position: 'fixed',
          top: `${positions[0]}px`,
          left: `${positions[1]}px`,
        });
        $divNtools.css({
          position: 'fixed',
          top: `${positions[2]}px`,
          left: `${positions[1]}px`,
        });
      }

      // Bouton pour cacher/montrer/déplacer .ntools au besoin.
      $divNtoolsToggle
        .append($buttonNtoolsToggle)
        .dblclick(() => {
          $('.ntools').slideToggle('fast');
          // Gestion de l'affichage du bloc en fonction du cookie pour éviter de gêner
          // quand on est en édition par exemple.
          if (nToolsCookie.read('ntools_toggle') === 'off') {
            nToolsCookie.create('ntools_toggle', 'on');
          }
          else {
            nToolsCookie.create('ntools_toggle', 'off');
          }
        })
        .mousedown(() => {
          window.addEventListener('mousemove', nTools.nToolsMove, true);
        })
        .mouseup((e) => {
          window.removeEventListener('mousemove', nTools.nToolsMove, true);
          nToolsCookie.create('ntools_toggle_positions', `${e.clientY}:${parseFloat(e.clientX - 50)}:${(parseFloat(e.clientY) + parseFloat($divNtoolsToggle.height()))}`);
        });
      $body.append($divNtoolsToggle);

      $body.append($divNtools);
      // Cachée ou pas selon le cookie.
      if (nToolsCookie.read('ntools_toggle') === 'off') {
        $('.ntools').css('display', 'none');
      }
      else {
        nToolsCookie.create('ntools_toggle', 'on');
      }

      // Lien de connexion avec gestion de la destination.
      if (login === 0) {
        pathPrefix = Drupal.settings === undefined ? drupalSettings.path.pathPrefix : Drupal.settings.pathPrefix;
        loginText = 'Log in';
        loginUrl = `/${pathPrefix}user/login?destination=${window.location.pathname.replace(pathPrefix.replace('/', ''), '')}`;
      }

      $link.attr('href', loginUrl).html(loginText);
      $div.append($link);
      $('.ntools', $body).append($div);

      // Affichage des classes intéressantes du body.
      if (nodeType !== null) {
        bodyClass += `${nodeType[0]}<br>`;
      }
      if (nTools.drupalVersion === 8) {
        bodyClass += `${nTools.backOfficeD8.pathname}<br>`;
      }
      else {
        if (pageNode !== null) {
          bodyClass += `${pageNode[0]}<br>`;
        }
        if (pageType !== null) {
          bodyClass += `${pageType[0]}<br>`;
        }
        if (pageTaxonomy !== null) {
          bodyClass += `${pageTaxonomy[0]}<br>`;
        }
        if (pageUser !== null) {
          bodyClass += `${pageUser[0]}<br>`;
        }
        if (pageContext !== null) {
          for (let i = 0; i < pageContext.length; i += 1) {
            const context = pageContext[i].split('context-');
            const $contextLink = $('<a></a>')
              .attr('href', `/admin/structure/context/list/${context[1].replace(dash, '_')}/edit`)
              .attr('title', 'Edit your context')
              .attr('target', '_blank')
              .html('E');

            bodyClass += pageContext[i];
            if (login === 1) {
              bodyClass += ` [${$contextLink[0].outerHTML}]`;
            }
            bodyClass += '<br>';
          }
        }
      }
      if (bodyClass !== '') {
        $divNtoolsBodyClass.append(bodyClass);
        $('.ntools', $body).append($divNtoolsBodyClass);
      }

      // Déplacement du bloc Masquerade dans la balise mère.
      $('.ntools', $body).append($masquerade);

      // Suppression d'une phrase que je juge inutile.
      $('.description', $masquerade)
        .contents()
        .filter((index, element) => element.nodeType !== 1)
        .remove();

      // Ajout des rôles sur chaque utilisateur.
      $('#quick_switch_links li', $masquerade).each((index, element) => {
        const $a = $('a', element);
        const uid = /\/([0-9]+)\?token/.exec($a.attr('href'));
        const roles = [];

        if (uid !== null && uid[1] !== '0') {
          $.get(
            `/user/${uid[1]}/edit`,
            (data) => {
              $('#edit-roles input:checked', data).each((index2, element2) => {
                roles.push($(`label[for="${$(element2).attr('id')}"]`, data).text());
              });

              $a.attr('title', roles.join('\r\n'));
            },
          );
        }
      });

      $.each(myTypes, (index, element) => {
        const { type } = element;
        let node = {};

        if (element.type === 'form') {
          node = $(element.id);
        }
        else {
          node = $(`.${element.id}`);
        }

        if (node[0] !== undefined) {
          $button = $('<button></button>')
            .html(`Show ${nToolsHelper.capitalize(type)}s`)
            .addClass(`ntools-${type}s-toggle`)
            .click((eventObject) => {
              if ($(`.show-${type}`).length === 0) {
                $(eventObject.currentTarget).html(`Hide ${nToolsHelper.capitalize(type)}s`);

                node.addClass(`ntools-show show-${type}`).each((index2, element2) => {
                  const $target = $(element2);
                  const targetClass = $target.attr('class');
                  const targetId = $target.attr('id') || $target.attr('data-quickedit-entity-id');
                  const classNode = targetClass.split(' ');
                  const links = [];
                  let flag = false;
                  let link = {};
                  let nameBlockReg = {};
                  let properties = [];
                  let bundle = [];
                  let classEntity = [];
                  let classIdView = [];
                  let classViewMode = [];
                  let classPromoted = [];
                  let classSticky = [];
                  let classUnpublished = [];
                  let url = '';
                  let nid = '';
                  let mid = '';
                  let output = '';
                  let idBlock = '';
                  let displayMode = '';
                  let display = '';
                  let whithoutDash = '';
                  let whithoutNode = '';
                  let whithoutProfile = '';
                  let whithoutParagraph = '';
                  let whithoutMedia = '';

                  // Un bouton pour mettre en évidence les régions.
                  if (type === 'region') {
                    classEntity = (/region\sregion-([a-z0-9-]+)\s/).exec(targetClass);
                    output = classEntity[1].replace(dash, '_');
                  }
                  // Un bouton pour mettre en évidence les blocs.
                  else if (type === 'block') {
                    classEntity = (/block\sblock--?([a-z0-9-]+)\s/).exec(targetClass);
                    nameBlockReg = new RegExp(`block-${classEntity[1]}-`, 'g');
                    whithoutDash = classEntity[1].replace(dash, '_');
                    idBlock = targetId.replace(nameBlockReg, '').replace(dash, '_');

                    // Ce lien permet d'éditer le bloc rapidement surtout dans le cas où
                    // le contextual link est absent.
                    if (login === 1) {
                      link = nToolsHelper.createLink(`/admin/structure/block/manage/${whithoutDash}/${idBlock}/configure`, 'Edit your block', 'E');
                      links.push(link);
                    }

                    output = `${whithoutDash} → ["${idBlock}"]`;
                  }
                  // Un bouton pour mettre en évidence les vues.
                  else if (type === 'view') {
                    classEntity = /view\sview-(\S+)/.exec(targetClass);
                    classIdView = /view-display-id-(\S+)/.exec(targetClass);
                    whithoutDash = classEntity[1].replace(dash, '_');

                    // Ce lien permet d'éditer la vue rapidement surtout dans le cas où
                    // le contextual link est absent.
                    if (login === 1) {
                      url = nTools.drupalVersion === 6 ? `/admin/build/views/edit/${whithoutDash}#view-tab-${classIdView[1]}` : `/admin/structure/views/view/${whithoutDash}/edit/${classIdView[1]}`;
                      link = nToolsHelper.createLink(url, 'Edit your view', 'E');
                      links.push(link);
                    }

                    output = `${whithoutDash} → ${classIdView[1]}`;
                  }
                  // Un bouton pour mettre en évidence les nodes.
                  else if (type === 'node') {
                    classViewMode = /node-teaser/.exec(targetClass);
                    classPromoted = /node-promoted/.exec(targetClass);
                    classSticky = /node-sticky/.exec(targetClass);
                    classUnpublished = /node-unpublished/.exec(targetClass);

                    if (nTools.drupalVersion === 8) {
                      classViewMode = /node--view-mode-(\S+)/.exec(targetClass);
                      bundle = /node--type-(\S+)/.exec(targetClass);
                      whithoutDash = bundle[1].replace(dash, '_');
                      whithoutNode = bundle[1].replace(dash, '_');

                      if (targetId !== undefined) {
                        nid = targetId.replace('node/', '');
                      }
                      else {
                        nid = 'N/A';
                      }

                      displayMode = ` → ${classViewMode[1].replace(dash, '_')}`;
                      display = `/${classViewMode[1].replace(dash, '_')}`;
                    }
                    else {
                      nid = targetId.replace('node-', '');
                      bundle = /node-(\S+)/.exec(targetClass);
                      whithoutDash = bundle[1].replace(dash, '_');
                      whithoutNode = bundle[1];

                      if (classPromoted !== null) {
                        properties.push('P');
                        flag = true;
                      }
                      if (classSticky !== null) {
                        properties.push('S');
                        flag = true;
                      }
                      if (classUnpublished !== null) {
                        properties.push('U');
                        flag = true;
                      }
                      if (flag) {
                        properties = ` (${properties.join()})`;
                      }

                      // Malheureusement, Drupal 7 ne gère que l'accroche.
                      if (classViewMode !== null) {
                        displayMode = ' → teaser';
                        display = '/teaser';
                      }
                    }

                    // Ces liens permettent d'aller rapidement à la liste des champs
                    // ou aux modes d'affichage du node.
                    if (login === 1) {
                      link = nToolsHelper.createLink(`/node/${nid}`, 'View this node', 'V');
                      links.push(link);
                      link = nToolsHelper.createLink(`/node/${nid}/edit`, 'Edit this node', 'E');
                      links.push(link);
                      link = nToolsHelper.createLink(`/admin/structure/types/manage/${whithoutNode}/fields`, `Manage your ${whithoutNode} fields`, 'F');
                      links.push(link);
                      link = nToolsHelper.createLink(`/admin/structure/types/manage/${whithoutNode}/display${display}`, `Manage your ${whithoutNode} displays`, 'D');
                      links.push(link);
                    }

                    output = `${whithoutDash}:${nid}${properties}${displayMode}`;
                  }
                  // Un bouton pour mettre en évidence les profiles.
                  else if (type === 'profile') {
                    whithoutDash = classNode[1].replace(dash, '_');
                    whithoutProfile = classNode[2].replace('profile2-', '').replace(dash, '_');

                    // Ces liens permettent d'aller rapidement à la liste des champs
                    // ou aux modes d'affichage du profile.
                    if (login === 1) {
                      link = nToolsHelper.createLink(`/admin/structure/profiles/manage/${whithoutProfile}/fields`, `Manage your ${whithoutProfile} fields`, 'F');
                      links.push(link);
                      link = nToolsHelper.createLink(`/admin/structure/profiles/manage/${whithoutProfile}/display`, `Manage your ${whithoutProfile} displays`, 'D');
                      links.push(link);
                    }

                    output = `${whithoutDash} → ${classNode[2].replace(dash, '_')}`;
                  }
                  // Un bouton pour mettre en évidence les fields.
                  else if (type === 'field') {
                    output = `${classNode[1].replace('field-name-', '').replace(dash, '_')} (${classNode[2].replace(dash, '_')})`;
                  }
                  // Un bouton pour mettre en évidence l'identifiant des formulaires.
                  else if (type === 'form') {
                    output = targetId.replace(dash, '_');
                  }
                  // Un bouton pour mettre en évidence les paragraphs.
                  else if (type === 'paragraph') {
                    whithoutParagraph = classNode[1].replace('paragraph--type--', '').replace(dash, '_');
                    classViewMode = /paragraph--view-mode--(\S+)/.exec(targetClass);
                    display = `/${classViewMode[1].replace(dash, '_')}`;

                    // Ces liens permettent d'aller rapidement à la liste des champs
                    // ou aux modes d'affichage du paragraph.
                    if (login === 1) {
                      link = nToolsHelper.createLink(`/admin/structure/paragraphs_type/${whithoutParagraph}/fields`, `Manage your ${whithoutParagraph} fields`, 'F');
                      links.push(link);
                      link = nToolsHelper.createLink(`/admin/structure/paragraphs_type/${whithoutParagraph}/display${display}`, `Manage your ${whithoutParagraph} displays`, 'D');
                      links.push(link);
                    }

                    output = `${whithoutParagraph} → ${classViewMode[1].replace(dash, '_')}`;
                  }
                  // Un bouton pour mettre en évidence les paragraphs.
                  else if (type === 'media') {
                    whithoutMedia = classNode[1].replace('media-', '').replace(dash, '_');
                    classViewMode = /view-mode-(\S+)/.exec(targetClass);
                    display = `/${classViewMode[1].replace(dash, '_')}`;

                    // Ces liens permettent d'aller rapidement à la liste des champs
                    // ou aux modes d'affichage du media.
                    if (login === 1) {
                      mid = targetId.replace('media/', '');
                      link = nToolsHelper.createLink(`/media/${mid}`, 'View this media', 'V');
                      links.push(link);
                      link = nToolsHelper.createLink(`/media/${mid}/edit`, 'Edit this media', 'E');
                      links.push(link);
                      link = nToolsHelper.createLink(`/admin/structure/media/manage/${whithoutMedia}/fields`, `Manage your ${whithoutMedia} fields`, 'F');
                      links.push(link);
                      link = nToolsHelper.createLink(`/admin/structure/media/manage/${whithoutMedia}/display${display}`, `Manage your ${whithoutMedia} displays`, 'D');
                      links.push(link);
                    }

                    output = `${whithoutMedia} → ${classViewMode[1].replace(dash, '_')}`;
                  }

                  nToolsHelper.addOverlay(element2, type, output, links);
                });

                nToolsHelper.addhideAllButton();
              }
              else {
                nToolsHelper.deleteOverlay(type);
              }
            });

          $('.ntools', $body).append($button);
        }
      });
    },

    loginFocus() {
      // Autofocus sur le login.
      $('#edit-name').focus();
    },

    styles() {
      const style = document.createElement('style');
      const rules =
        `.page-admin table .odd:hover,
        .page-admin table .even:hover,
        .homebox-column-wrapper table .odd:hover,
        .homebox-column-wrapper table .even:hover {
          background-color: #E1E2DC;
        }
        th.filter {
          cursor: pointer;
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
          cursor: move;
          font-family: Helvetica;
          font-size: 14px;
          margin: 0;
          padding: 2px 5px;
          width: 100px;
        }
        .ntools {
          background-color: #202020;
          color: #FFF; min-width: 105px;
          padding: 5px 5px 0 5px;
          position: fixed;
          left: 0;
          top: 149px;
          z-index: 900;
        }
        .ntools * {
          box-sizing: content-box;
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
        .ntools>div {
          margin-bottom: 3px;
          padding-bottom: 2px;
        }
        .ntools-user {
          border-bottom: 1px solid #FFF;
        }
        #block-masquerade-masquerade,
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
        #block-masquerade-masquerade .item-list ul li {
          margin: 0;
          padding: 0;
        }
        .ntools button {
          border: none;
          border-radius: 0;
          color: #FFF;
          cursor: pointer;
          display: block;
          margin: 0 0 5px;
          padding: 2px 5px;
          width: 93%;
        }
        .ntools-regions-toggle {
          background: #018FE2;
        }
        .ntools-regions-toggle:hover {
          background: #0073B7;
        }
        .ntools-blocks-toggle {
          background: #B73939;
        }
        .ntools-blocks-toggle:hover {
          background: #9F2B2B;
        }
        .ntools-views-toggle {
          background: #FFA300;
        }
        .ntools-views-toggle:hover {
          background: #DA900C;
        }
        .ntools-nodes-toggle,
        .ntools-profiles-toggle {
          background: #4D8F46;
        }
        .ntools-nodes-toggle:hover,
        .ntools-profiles-toggle:hover {
          background: #277D1E;
        }
        .ntools-fields-toggle,
        .ntools-paragraphs-toggle,
        .ntools-medias-toggle {
          background: #783A00;
        }
        .ntools-fields-toggle:hover,
        .ntools-paragraphs-toggle:hover,
        .ntools-medias-toggle:hover {
          background: #4E2500;
        }
        .ntools-forms-toggle {
          background: #4A3657;
        }
        .ntools-forms-toggle:hover {
          background: #3B2549;
        }
        .ntools-hide-all-toggle {
          background: #000;
        }
        .ntools-hide-all-toggle:hover {
          background: #3B3B3B;
        }
        .ntools-show {
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
          cursor: initial;
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
          display: inline;
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
        .ntools-field-name,
        .ntools-paragraph-name,
        .ntools-media-name {
          background-color: #783A00;
        }
        .ntools-form-name {
          background-color: #4A3657;
        }
        .ntools-links a {
          margin-right: 3px;
        }
        .ntools-hidden {
          background: #000;
          border: none;
          color: #FFF;
          cursor: pointer;
          margin-left: 5px;
          padding: 5px;
        }`;
      const textNode = document.createTextNode(rules);

      style.appendChild(textNode);
      document.head.appendChild(style);
    },
  };

  nTools.styles();
  nTools.highlightTitle();

  // Drupal version.
  if (typeof drupalSettings !== 'undefined') {
    nTools.drupalVersion = 8;
  }
  else if (typeof Drupal.themes === 'undefined') {
    nTools.drupalVersion = 7;
  }
  else {
    nTools.drupalVersion = 6;
  }

  if ($('body[class*="page-admin"]').length === 1) {
    nTools.backOfficeD7();
  }
  else if ($('body[class*="path-admin"]').length === 1) {
    nTools.backOfficeD8();
  }
  else {
    nTools.toolbar();
    nTools.loginFocus();
  }
}(jQuery, window.Drupal, window.drupalSettings));
