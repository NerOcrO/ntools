// ==UserScript==
// @name         NTools
// @author       NerOcrO
// @description  Script who help developers on Drupal 7/8
// @grant        none
// @require      https://code.jquery.com/jquery-3.2.1.min.js
// @include      localhost
// @version      4.0
// ==/UserScript==

(function ($) {
  "use strict";

  var Drupal = window.Drupal;
  var drupalSettings = window.drupalSettings;
  if (typeof unsafeWindow !== "undefined") {
    Drupal = unsafeWindow.Drupal;
    drupalSettings = unsafeWindow.drupalSettings;
  }

  String.prototype.capitalize = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
  };

  var nToolsCookie = {
    // Créer/éditer un cookie.
    create: function (name, value, days = 365) {
      var expires = "";
      var date;

      if (days) {
        date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toGMTString();
      }

      document.cookie = name + "=" + value + expires + "; path=/";
    },

    // Lire un cookie.
    read: function (name) {
      var nameEQ = name + "=";
      var ca = document.cookie.split(";");
      var i;
      var c;
      for (i = 0; i < ca.length; i+=1) {
        c = ca[i];
        while (c.charAt(0) === " ") {
          c = c.substring(1, c.length);
        }
        if (c.indexOf(nameEQ) === 0) {
          return c.substring(nameEQ.length, c.length);
        }
      }
      return null;
    },

    // Supprimer un cookie.
    erase: function (name) {
      nToolsCookie.create(name, "", -1);
    }
  };

  var nToolsHelper = {
    // Configure de façon pertinente la traduction des entités.
    configuringEntityTranslation: function () {
      $("#entity-translation-admin-form").find("fieldset").each(function () {
        $("select option[value=\"xx-et-default\"]", this).attr("selected", true);
        $("input[id*=\"-hide-language-selector\"]", this).prop("checked", true);
        $("input[id*=\"-exclude-language-none\"]", this).prop("checked", true);
        $("input[id*=\"-shared-fields-original-only\"]", this).prop("checked", true);
      });
    },

    // Met à <hidden> toutes les étiquettes des champs dans "Gérer l'affichage".
    hideAllField: function () {
      var $table = $("#field-display-overview");
      var $headCell = $table.find("th:nth-last-child(2)");
      var $stickyCell = $(".sticky-header").find("th:nth-last-child(2)");
      var $select = $table.find("tbody td:nth-last-child(4) select");

      $headCell.append(
        $("<button></button>")
        .html("Hide all")
        .addClass("ntools-hidden")
        .click(function () {
          $select.find("option[value=\"hidden\"]").each(function () {
            $(this).attr("selected", true);
          });

          return false;
        })
      );

      $stickyCell.append($headCell.find("button").clone(true));
    },

    // Retire tous les champs dans "Gérer l'affichage".
    removeAllField: function () {
      var $table = $("#field-display-overview");
      var $headCell = $table.find("thead th:nth-last-child(1)");
      var $stickyCell = $(".sticky-header").find("th:nth-last-child(1)");
      var $select = $table.find("select.field-region");

      // Drupal 8.3 intègre un nouveau select (région) qui désactive maintenant
      // le champ.
      if (!$select.length) {
        $select = $table.find("tbody td:nth-last-child(3) select");
      }

      $headCell.append(
        $("<button></button>")
        .html("Disable all")
        .addClass("ntools-hidden")
        .click(function () {
          $select.find("option[value=\"hidden\"]").each(function () {
            $(this).attr("selected", true);
          });

          // Déclenche le call AJAX pour le 1er élément, déclenchant les autres.
          $select.first().trigger("change");

          return false;
        })
      );

      $stickyCell.append($headCell.find("button").clone(true));
    },

    // Ajoute une zone transparente sur l"élément voulu.
    addOverlay: function (node, type, output, links) {
      var nameLinks = $("<span/>").addClass("ntools-links");
      var i;
      for (i = 0; i < links.length; i+=1) {
        nameLinks.append(links[i]);
      }

      $(node).append(
        $("<div></div>")
        .addClass("ntools-highlight")
        .append(
          $("<div></div>")
          .addClass("ntools-" + type + "-name")
          .html(output)
          .prepend(nameLinks)
          .click(function (e) {
            e.stopPropagation();
          })
        )
        .click(function () {
          nToolsHelper.deleteOverlay(type, this);
        })
      );
    },

    // Supprime une ou plusieurs zones transparentes.
    deleteOverlay: function (type, element) {
      var flag = false;
      var $node;

      if (typeof element === "object") {
        $node = $(element).parent();
        flag = $("." + type).find(".ntools-highlight").length === 1;
      } else {
        $node = $(".show-" + type);
        flag = true;
      }

      $node.find(" > .ntools-highlight").remove();
      $node.removeClass("ntools-show show-" + type);
      if (flag) {
        $(".ntools-" + type + "s-toggle").html("Show " + type.capitalize() + "s");
      }

      // Si toutes les zones n"existent plus, on efface le bouton "Hide all".
      if ($(".ntools-highlight").length === 0) {
        $(".ntools-hide-all-toggle").remove();
      }
    },

    // Ajoute le bouton "Hide all" qui efface toutes les zones transparentes.
    addhideAllButton: function (type) {
      if ($(".ntools-hide-all-toggle").length === 0) {
        $("body").find(".ntools").append(
          $("<button></button>")
          .html("Hide all")
          .addClass("ntools-hide-all-toggle")
          .click(function () {
            nToolsHelper.deleteOverlay("region");
            nToolsHelper.deleteOverlay("block");
            nToolsHelper.deleteOverlay("view");
            nToolsHelper.deleteOverlay("node");
            nToolsHelper.deleteOverlay("profile");
            nToolsHelper.deleteOverlay("field");
            nToolsHelper.deleteOverlay("form");
            nToolsHelper.deleteOverlay("paragraph");
          })
        );
      }
    },

    // Ajoute un <td> sur l"élément voulu.
    addTd: function (node, output) {
      $(node).prepend(
        $("<td></td>")
        .addClass("ntools-help")
        .html(output)
      );
    },

    // Ajoute un span sur l"élément voulu.
    addSpan: function (node, selector, output) {
      $(node).find(selector).prepend(
        $("<span></span>")
        .addClass("ntools-help")
        .html(output)
      );
    },

    // Crée un <th>.
    createTh: function (output, colspan, classs) {
      output = typeof output !== "undefined" ? output : "Machine name";
      colspan = typeof colspan !== "undefined" ? colspan : 1;
      classs = typeof classs !== "undefined" ? classs : "";

      return $("<th></th>")
        .attr("colspan", colspan)
        .addClass(classs)
        .html(output);
    },

    // Crée un lien qui pointe vers un nouvel onglet.
    createLink: function (href, title, output) {
      return $("<a></a>")
        .attr("href", href)
        .attr("target", "_blank")
        .attr("title", title)
        .html(output)
        .click(function (e) {
          e.stopPropagation();
        });
    },

    addHelp: function (selector, target, th_name, prefix, suffix) {
      var slash = new RegExp("/", "g");
      var output = "";
      th_name = typeof th_name !== "undefined" ? th_name : "Machine name";
      prefix = typeof prefix !== "undefined" ? prefix : "";
      suffix = typeof suffix !== "undefined" ? suffix : "";

      $("table")
        .find("thead tr").prepend(nToolsHelper.createTh(th_name))
        .parent().parent()
        .find("tbody tr").each(function () {
          var url = $(this).find(selector);
          var url_split = "";

          if (url[0] !== undefined) {
            url = url.attr("href").split("?destination");
            url_split = url[0].split(slash);

            output = prefix + url_split[url_split.length - target] + suffix;
          } else {
            output = "-";
          }

          nToolsHelper.addTd(this, output);
        });
    },

    // Order added on field's list table.
    addReportsOrder: function (parent, selector) {
      $(parent).find(selector).click(function () {
          var table = $(this).parents("table").eq(0);
          var rows = table.find("tr:gt(0)").toArray().sort(compare($(this).index()));
          var i;

          table.find("th").removeClass().addClass("filter");
          $(this).addClass("active");
          this.asc = !this.asc;

          if (!this.asc) {
            rows = rows.reverse();
          }

          for (i = 0; i < rows.length; i+=1) {
            table.append(rows[i]);
          }

          function compare(index) {
            return function (a, b) {
              var valA = $(a).children("td").eq(index).html();
              var valB = $(b).children("td").eq(index).html();
              return !isNaN(parseFloat(valA)) && !isNaN(parseFloat(valB)) ? valA - valB : valA.localeCompare(valB);
            };
          }
        })
        .addClass("filter");
    },

    removeDropButton: function () {
      // Not for Views.
      if ($("form").attr("data-drupal-form-fields")) {
        return;
      }
      $(".dropbutton-wrapper").removeClass()
        .find(".dropbutton-widget").removeClass()
        .find(".dropbutton").removeClass()
        .find(".dropbutton-toggle").remove();
    }
  };

  var nTools = {

    backOfficeD8: function () {

      /*
       *****************************************************************************
       * Content
       *****************************************************************************
       */
      if (drupalSettings.path.currentPath === "admin/content") {
        // NID added on content list.
        nToolsHelper.addHelp(".edit a", 2, "NID");
      } else if (drupalSettings.path.currentPath === "admin/content/files") {
        // FID added on file list.
        nToolsHelper.addHelp(".views-field-count a", 1, "FID");
      } else if (drupalSettings.path.currentPath === "admin/content/media") {
        // FID added on media list.
        nToolsHelper.addHelp(".edit a", 2, "MID");
      }
      /*
       *****************************************************************************
       * Structure
       *****************************************************************************
       */
      // else if (drupalSettings.path.currentPath === "admin/structure/block") {
      //   // Machine name added on blocks list.
      //   $("[data-drupal-selector=\"edit-blocks\"]")
      //   .find("thead tr").prepend(nToolsHelper.createTh("base_block_id"))
      //   .parent().parent()
      //   .find("tbody tr").each(function () {
      //     var tr = $(this),
      //       draggable = tr.is(".draggable"),
      //       output = "-";

      //     if (draggable) {
      //       // var selector = /edit-blocks-[a-z]+-(.+)/g.exec(tr.attr("data-drupal-selector"));
      //       // output = "id = "" + tr.find("td:nth-child(2)").html().toLowerCase() + "_" + selector[1] + "_block"";
      //       // En attente de : https://www.drupal.org/node/2641862
      //       output = "id&nbsp;=&nbsp;"" + tr.attr("data-drupal-plugin-id") + """;
      //     }

      //     nToolsHelper.addTd(this, output);
      //   });
      // }
      else if (drupalSettings.path.currentPath === "admin/structure/types") {
        // Machine name added on content type list.
        nToolsHelper.addHelp(".manage-fields a", 2);
      } else if (drupalSettings.path.currentPath === "admin/structure/display-modes/form") {
        // Machine name added on display modes form list.
        nToolsHelper.addHelp(".edit a", 1);
      } else if (drupalSettings.path.currentPath === "admin/structure/display-modes/view") {
        // Machine name added on display modes view list.
        nToolsHelper.addHelp(".edit a", 1);
      } else if (drupalSettings.path.currentPath === "admin/structure/menu") {
        // Machine name added on menu list.
        nToolsHelper.addHelp(".edit a", 1);
      } else if (drupalSettings.path.currentPath === "admin/structure/taxonomy") {
        // Machine name added on vocabularies list.
        nToolsHelper.addHelp(".list a", 2);
      } else if (
        drupalSettings.path.currentPath.substring(0, 31) === "admin/structure/taxonomy/manage"
        && (/admin\/structure\/taxonomy\/manage\/(.+)\/overview\/(.+)/g).exec(drupalSettings.path.currentPath) === null
      ) {
        // TID added on terms list.
        nToolsHelper.addHelp(".edit a", 2, "TID");
      } else if (drupalSettings.path.currentPath === "admin/structure/views") {
        // Machine name added on menu list.
        nToolsHelper.addHelp(".edit a", 1, "", "id:&nbsp;");
      }

      /*
       *****************************************************************************
       * People
       *****************************************************************************
       */
      else if (drupalSettings.path.currentPath === "admin/people") {
        // UID added on users list.
        nToolsHelper.addHelp(".edit a", 2, "UID");
      } else if (drupalSettings.path.currentPath === "admin/people/permissions") {
        // Machine name added on permissions list.
        $("[data-drupal-selector=\"permissions\"]")
          .find("thead tr").prepend(nToolsHelper.createTh())
          .parent().parent()
          .find("tbody tr").each(function () {
            var tableau = /\[(.+)\]/.exec($(this).find("input").attr("name"));
            var output = "-";

            if (tableau !== null) {
              output = "\"" + tableau[1] + "\"";
            }

            nToolsHelper.addTd(this, output);
          });
      } else if (drupalSettings.path.currentPath === "admin/people/roles") {
        // Machine name added on roles list.
        nToolsHelper.addHelp(".edit a", 1);
      }

      /*
       *****************************************************************************
       * Modules
       *****************************************************************************
       */
      else if (drupalSettings.path.currentPath === "admin/modules") {
        // Machine name added on modules list.
        $("[data-drupal-selector=\"system-modules\"]")
          .find("thead tr").prepend(nToolsHelper.createTh("Machine name", 1, "visually-hidden"))
          .parent().parent()
          .find("tbody tr").each(function () {
            var output = /\[.+\]\[(.+)\]\[.+\]/g.exec($(this).find("input").attr("name"));

            nToolsHelper.addTd(this, output[1]);
          });
      }

      /*
       *****************************************************************************
       * Reports
       *****************************************************************************
       */
      else if (drupalSettings.path.currentPath === "admin/reports/fields") {
        nToolsHelper.addReportsOrder("table", "th");
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

    backOfficeD7: function () {

      var slash = new RegExp("/", "g");
      var pathname = window.location.pathname.replace(Drupal.settings.pathPrefix, "");

      /*
       *****************************************************************************
       * Content
       *****************************************************************************
       */
      if (pathname === "/admin/content") {
        // Ajout de l'identifiant sur la liste des nodes.
        nToolsHelper.addHelp("td:last-child a", 2, "NID");
      }

      /*
       *****************************************************************************
       * Structure
       *****************************************************************************
       */
      else if (pathname === "/admin/structure/block") {
        // Ajout de la machine name sur la liste des blocs.
        $("table")
          .find("thead tr").prepend(nToolsHelper.createTh())
          .parent().parent()
          .find("tbody tr").each(function () {
            var a = $(this).find("a[id*=\"edit-\"]").attr("href");
            var output = "-";
            var href;

            if (a !== undefined) {
              href = a.split(slash);
              output = href[href.length - 3] + " → [\"" + href[href.length - 2] + "\"]";
            }

            nToolsHelper.addTd(this, output);
          });
      } else if (pathname === "/admin/structure/taxonomy") {
        // Ajout du VID sur la liste des vocabulaires.
        $("table")
          .find("thead tr").prepend(nToolsHelper.createTh("VID"))
          .parent().parent()
          .find("tbody tr").each(function () {
            var a = /(.+)\[.+\]/g.exec($(this).find("select").attr("name"));

            nToolsHelper.addTd(this, a[1]);
          });
        // Ajout de la machine name sur la liste des vocabulaires.
        nToolsHelper.addHelp("td:last-child a", 2);
        // Ajout des liens "Gérer les champs" et "Gérer l'affichage" sur la liste des vocabulaires.
        $("table")
          .find("thead tr").append(nToolsHelper.createTh("Operations +", 2))
          .parent().parent()
          .find("tbody tr").each(function () {
            var a = $(this).find("td:last-child a").attr("href").split(slash);
            var url = a[a.length - 2];
            var aField = $("<a></a>").attr("href", "/admin/structure/taxonomy/" + url + "/fields").html("Manage fields");
            var aDisplay = $("<a></a>").attr("href", "/admin/structure/taxonomy/" + url + "/display").html("Manage display");
            var tdField = $("<td></td>").addClass("ntools-help").html(aField);
            var tdDisplay = $("<td></td>").addClass("ntools-help").html(aDisplay);

            $(this).append(tdField).append(tdDisplay);
          });
      } else if (
        pathname.substring(0, 26) === "/admin/structure/taxonomy/"
        && (/\/admin\/structure\/taxonomy\/(.+)\/(.+)/g).exec(pathname) === null
      ) {
        // Ajout du TID sur la liste des termes.
        nToolsHelper.addHelp("td:last-child a", 2, "TID");
      } else if (pathname === "/admin/structure/views") {
        // Ajout de la machine name sur la liste des vues.
        nToolsHelper.addHelp(".first a", 2, "", "$view->name = \"", "\";");
      }

      /*
       *****************************************************************************
       * People
       *****************************************************************************
       */
      else if (pathname === "/admin/people") {
        // Ajout de l'identifiant sur la liste des utilisateurs.
        nToolsHelper.addHelp("td:last-child a", 2, "UID");
      } else if (
        pathname === "/admin/people/permissions"
        || (/\/admin\/config\/group\/permissions\/(.+)\/(.+)/g).exec(pathname) !== null
      ) {
        // Ajout de la machine name sur la liste des permissions.
        $("table")
          .find("thead tr").prepend(nToolsHelper.createTh())
          .parent().parent()
          .find("tbody tr").each(function () {
            var tableau = /\[(.+)\]/.exec($(this).find("input").attr("name"));
            var output = "-";

            if (tableau !== null) {
              output = "\"" + tableau[1] + "\"";
            }

            nToolsHelper.addTd(this, output);
          });
      } else if (pathname === "/admin/people/permissions/roles") {
        // Ajout de l'identifiant sur la liste des rôles.
        nToolsHelper.addHelp("td:last-child a", 1, "RID");
      }

      /*
       *****************************************************************************
       * Modules
       *****************************************************************************
       */
      else if (pathname === "/admin/modules") {
        // Ajout de la machine name sur la liste des modules.
        $("table")
          .find("thead tr").prepend(nToolsHelper.createTh())
          .parent().parent()
          .find("tbody tr").each(function () {
            var output = /\[.+\]\[(.+)\]\[.+\]/g.exec($(this).find("input").attr("name"));
            nToolsHelper.addTd(this, output[1]);
          });
      }

      /*
       *****************************************************************************
       * Configuration
       *****************************************************************************
       */
      else if (pathname === "/admin/config/regional/entity_translation") {
        // Ajout d'un bouton pour configurer de façon pertinente
        // la traduction des entités.
        $("#entity-translation-admin-form").find("#edit-actions").append(
          $("<button></button>")
          .html("Configuring")
          .addClass("ntools-hidden")
          .click(function () {
            nToolsHelper.configuringEntityTranslation();
            return false;
          })
        );
      } else if (pathname === "/admin/config/search/apachesolr/settings/solr/facets") {
        // Ajout de la machine name sur la liste des facettes.
        nToolsHelper.addHelp(".first a", 2);
      }

      /*
       *****************************************************************************
       * Reports
       *****************************************************************************
       */
      else if (pathname === "/admin/reports/fields") {
        // Le tableau de la liste des champs peu être trié.
        nToolsHelper.addReportsOrder(".page-admin-reports-fields", ".sticky-enabled th");
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
      $("#field-overview tbody tr").each(function () {
        var text = $(this).find("td:nth-child(5)").text();
        var $field;
        var textField;

        if (text === "Field collection") {
          $field = $(this).find("td:nth-child(4)");
          textField = $field.html();

          $field.html("")
            .prepend(
              $("<a></a>")
              .attr("href", "/admin/structure/field-collections/" + textField + "/fields")
              .addClass("ntools-help")
              .html(textField)
            );
        }
      });
    },

    toolbar: function () {

      var body = $("body");
      var bodyClasses = body.attr("class");
      var bodyClass = "";
      var pageNode = /page-node-([0-9]+)/.exec(bodyClasses);
      var nodeType = /node-type-(\S+)/.exec(bodyClasses);
      var paragraphType = /paragraph--type--(\S+)/.exec(bodyClasses);
      var pageType = /page-type-(\S+)/.exec(bodyClasses);
      var pageTaxonomy = /page-taxonomy-term-([0-9]+)/.exec(bodyClasses);
      var pageUser = /page-user-([0-9]+)/.exec(bodyClasses);
      var pageContext = bodyClasses.match(/context-(\S+)/g);
      var empty = new RegExp(" ", "g");
      var slash = new RegExp("/", "g");
      var dash = new RegExp("-", "g");
      var login = $(".logged-in, .user-logged-in").length;
      var positions = "";
      var stylePosition1 = "";
      var stylePosition2 = "";
      var ntoolsToggle = "";
      var masquerade = $("#block-masquerade-masquerade");
      var myTypes = [{
            id: "region",
            type: "region"
          },
          {
            id: "block",
            type: "block"
          },
          {
            id: "view",
            type: "view"
          },
          {
            id: "node",
            type: "node"
          },
          {
            id: "entity-profile2",
            type: "profile"
          },
          {
            id: "field",
            type: "field"
          },
          {
            id: "form",
            type: "form"
          },
          {
            id: "paragraph",
            type: "paragraph"
          },
        ];

      // On lit les dernières positions de la barre d'outils.
      if (nToolsCookie.read("ntools_toggle_positions") !== null) {
        positions = nToolsCookie.read("ntools_toggle_positions").split(":");
        stylePosition1 = " style=\"position:fixed;top:" + positions[0] + "px;left:" + positions[1] + "px\"";
        stylePosition2 = " style=\"position:fixed;top:" + positions[2] + "px;left:" + positions[1] + "px\"";
      }

      // Bouton pour cacher/montrer/déplacer .ntools au besoin.
      body.append("<div class=\"ntools-toggle\"" + stylePosition1 + "><button>≡≡≡≡≡≡≡</button></div>");
      ntoolsToggle = $(".ntools-toggle");
      ntoolsToggle.dblclick(function () {
          $(".ntools").slideToggle("fast");
          // Gestion de l'affichage du bloc en fonction du cookie pour éviter de gêner
          // quand on est en édition par exemple.
          if (nToolsCookie.read("ntools_toggle") === "off") {
            nToolsCookie.create("ntools_toggle", "on");
          } else {
            nToolsCookie.create("ntools_toggle", "off");
          }
        })
        .mousedown(function (e) {
          window.addEventListener("mousemove", nToolsMove, true);
        })
        .mouseup(function (e) {
          window.removeEventListener("mousemove", nToolsMove, true);
          nToolsCookie.create("ntools_toggle_positions", e.clientY + ":" + parseFloat(e.clientX - 50) + ":" + (parseFloat(e.clientY) + parseFloat(ntoolsToggle.height())));
        });

      body.append("<div class=\"ntools\"" + stylePosition2 + "></div>");
      // Cachée ou pas selon le cookie.
      if (nToolsCookie.read("ntools_toggle") === "off") {
        $(".ntools").css("display", "none");
      } else {
        nToolsCookie.create("ntools_toggle", "on");
      }

      function nToolsMove(e) {
        var ntools = $(".ntools");
        var top1 = e.clientY;
        var left1 = e.clientX - 50;
        var top2 = parseFloat(top1) + ntoolsToggle.height();

        ntoolsToggle.css({
          "position": "fixed",
          "top": top1 + "px",
          "left": left1 + "px"
        });

        ntools.css({
          "position": "fixed",
          "top": top2 + "px",
          "left": left1 + "px"
        });
      }

      // Affichage du lien pour se connecter avec gestion de la destination.
      if (login === 0) {
        var pathPrefix = "";

        if (Drupal.settings === undefined) {
          pathPrefix = drupalSettings.path.pathPrefix;
        } else {
          pathPrefix = Drupal.settings.pathPrefix;
        }

        body.find(".ntools").append(
          $("<div></div>")
          .addClass("ntools-user")
          .append(
            $("<a></a>")
            .attr("href", "/" + pathPrefix + "user/login?destination=" + window.location.pathname.replace(pathPrefix.replace("/", ""), ""))
            .html("Log in")
          )
        );
      }
      // Affichage du lien pour se déconnecter.
      else {
        body.find(".ntools").append(
          $("<div></div>")
          .addClass("ntools-user")
          .append(
            $("<a></a>")
            .attr("href", "/user/logout")
            .html("Log out")
          )
        );
      }

      // Affichage des classes intéressantes du body.
      if (nodeType !== null) {
        bodyClass += nodeType[0] + "<br>";
      }
      if (nTools.drupalVersion === 8) {
        bodyClass += drupalSettings.path.currentPath + "<br>";
      } else {
        if (pageNode !== null) {
          bodyClass += pageNode[0] + "<br>";
        }
        if (pageType !== null) {
          bodyClass += pageType[0] + "<br>";
        }
        if (pageTaxonomy !== null) {
          bodyClass += pageTaxonomy[0] + "<br>";
        }
        if (pageUser !== null) {
          bodyClass += pageUser[0] + "<br>";
        }
        if (pageContext !== null) {
          var arrayLength = pageContext.length;
          var i;
          var context;

          for (i = 0; i < arrayLength; i+=1) {
            context = pageContext[i].split("context-");
            bodyClass += pageContext[i];
            if (login === 1) {
              bodyClass += " [<a href=\"/admin/structure/context/list/" + context[1].replace(dash, "_") + "/edit\" title=\"Edit your context\" target=\"_blank\">E</a>]";
            }
            bodyClass += "<br>";
          }
        }
      }
      if (bodyClass !== "") {
        body.find(".ntools").append("<div class=\"ntools-body-class\">" + bodyClass + "</div>");
      }

      // Déplacement du bloc Masquerade dans la balise mère.
      body.find(".ntools").append(masquerade);

      // Suppression d'une phrase que je juge inutile.
      masquerade.find(".description")
        .contents()
        .filter(function () {
          return this.nodeType !== 1;
        })
        .remove();

      // Ajout des rôles sur chaque utilisateur.
      masquerade.find("#quick_switch_links li").each(function () {
        var a = $(this).find("a");
        var uid = /\/([0-9]+)\?token/.exec(a.attr("href"));
        var roles = [];

        if (uid !== null && uid[1] !== "0") {
          $.get(
            "/user/" + uid[1] + "/edit",
            function (data) {
              $("#edit-roles input:checked", data).each(function () {
                roles.push($("label[for=\"" + $(this).attr("id") + "\"]", data).text());
              });

              a.attr("title", roles.join("\r\n"));
            }
          );
        }
      });

      $.each(myTypes, function () {
        var node;
        var type = this.type;

        if (this.type === "form") {
          node = $(this.id);
        } else {
          node = $("." + this.id);
        }

        if (node[0] !== undefined) {
          body.find(".ntools").append(
            $("<button></button>")
            .html("Show " + type.capitalize() + "s")
            .addClass("ntools-" + type + "s-toggle")
            .click(function () {
              if ($(".show-" + type).length === 0) {
                $(this).html("Hide " + type.capitalize() + "s");

                node.addClass("ntools-show show-" + type).each(function () {
                  var target = $(this);
                  var targetClass = target.attr("class");
                  var targetId = target.attr("id") || target.attr("data-quickedit-entity-id");
                  var classNode = targetClass.split(" ");
                  var flag = false;
                  var properties = [];
                  var links = [];
                  var link;
                  var url;
                  var bundle;
                  var nid;
                  var output;
                  var classRegion;
                  var classBlock;
                  var idBlock;
                  var nameBlockReg;
                  var classView;
                  var classIdView;
                  var classViewMode;
                  var classPromoted;
                  var classSticky;
                  var classUnpublished;
                  var displayMode;
                  var display;
                  var whithoutDash;
                  var whithoutNode;
                  var whithoutProfile;
                  var whithoutParagraph;

                  // Un bouton pour mettre en évidence les régions.
                  if (type === "region") {
                    classRegion = (/region\sregion\-([a-z0-9\-]+)\s/).exec(targetClass);
                    output = classRegion[1].replace(dash, "_");
                  }
                  // Un bouton pour mettre en évidence les blocs.
                  else if (type === "block") {
                    classBlock = (/block\sblock--?([a-z0-9\-]+)\s/).exec(targetClass);
                    nameBlockReg = new RegExp("block-" + classBlock[1] + "-", "g");
                    whithoutDash = classBlock[1].replace(dash, "_");
                    idBlock = targetId.replace(nameBlockReg, "").replace(dash, "_");

                    // Ce lien permet d"éditer le bloc rapidement surtout dans le cas où
                    // le contextual link est absent.
                    if (login === 1) {
                      link = nToolsHelper.createLink("/admin/structure/block/manage/" + whithoutDash + "/" + idBlock + "/configure", "Edit your block", "E");
                      links.push(link);
                    }

                    output = whithoutDash + " → [\"" + idBlock + "\"]";
                  }
                  // Un bouton pour mettre en évidence les vues.
                  else if (type === "view") {
                    classView = /view\sview-(\S+)/.exec(targetClass);
                    classIdView = /view-display-id-(\S+)/.exec(targetClass);
                    whithoutDash = classView[1].replace(dash, "_");

                    // Ce lien permet d"éditer la vue rapidement surtout dans le cas où
                    // le contextual link est absent.
                    if (login === 1) {
                      url = nTools.drupalVersion === 6 ? "/admin/build/views/edit/" + whithoutDash + "#view-tab-" + classIdView[1] : "/admin/structure/views/view/" + whithoutDash + "/edit/" + classIdView[1];
                      link = nToolsHelper.createLink(url, "Edit your view", "E");
                      links.push(link);
                    }

                    output = whithoutDash + " → " + classIdView[1];
                  }
                  // Un bouton pour mettre en évidence les nodes.
                  else if (type === "node") {
                    classViewMode = /node-teaser/.exec(targetClass);
                    classPromoted = /node-promoted/.exec(targetClass);
                    classSticky = /node-sticky/.exec(targetClass);
                    classUnpublished = /node-unpublished/.exec(targetClass);
                    displayMode = "";
                    display = "";

                    if (nTools.drupalVersion === 8) {
                      classViewMode = /node--view-mode-(\S+)/.exec(targetClass);
                      bundle = /node--type-(\S+)/.exec(targetClass);
                      whithoutDash = bundle[1].replace(dash, "_");
                      whithoutNode = bundle[1].replace(dash, "_");

                      if (targetId !== undefined) {
                        nid = targetId.replace("node/", "");
                      } else {
                        nid = "N/A";
                      }

                      displayMode = " → " + classViewMode[1].replace(dash, "_");
                      display = "/" + classViewMode[1].replace(dash, "_");
                    } else {
                      nid = targetId.replace("node-", "");
                      bundle = /node-(\S+)/.exec(targetClass);
                      whithoutDash = bundle[1].replace(dash, "_");
                      whithoutNode = bundle[1];

                      if (classPromoted !== null) {
                        properties.push("P");
                        flag = true;
                      }
                      if (classSticky !== null) {
                        properties.push("S");
                        flag = true;
                      }
                      if (classUnpublished !== null) {
                        properties.push("U");
                        flag = true;
                      }
                      if (flag) {
                        properties = " (" + properties.join() + ")";
                      }

                      // Malheureusement, Drupal 7 ne gère que l'accroche.
                      if (classViewMode !== null) {
                        displayMode = " → teaser";
                        display = "/teaser";
                      }
                    }

                    // Ces liens permettent d'aller rapidement à la liste des champs
                    // ou aux modes d'affichage du node.
                    if (login === 1) {
                      link = nToolsHelper.createLink("/node/" + nid, "View this node", "V");
                      links.push(link);
                      link = nToolsHelper.createLink("/node/" + nid + "/edit", "Edit this node", "E");
                      links.push(link);
                      link = nToolsHelper.createLink("/admin/structure/types/manage/" + whithoutNode + "/fields", "Manage your " + whithoutNode + " fields", "F");
                      links.push(link);
                      link = nToolsHelper.createLink("/admin/structure/types/manage/" + whithoutNode + "/display" + display, "Manage your " + whithoutNode + " displays", "D");
                      links.push(link);
                    }

                    output = whithoutDash + ":" + nid + properties + displayMode;
                  }
                  // Un bouton pour mettre en évidence les profiles.
                  else if (type === "profile") {
                    whithoutDash = classNode[1].replace(dash, "_");
                    whithoutProfile = classNode[2].replace("profile2-", "").replace(dash, "_");

                    // Ces liens permettent d'aller rapidement à la liste des champs
                    // ou aux modes d'affichage du profile.
                    if (login === 1) {
                      link = nToolsHelper.createLink("/admin/structure/profiles/manage/" + whithoutProfile + "/fields", "Manage your " + whithoutProfile + " fields", "F");
                      links.push(link);
                      link = nToolsHelper.createLink("/admin/structure/profiles/manage/" + whithoutProfile + "/display", "Manage your " + whithoutProfile + " displays", "D");
                      links.push(link);
                    }

                    output = whithoutDash + " → " + classNode[2].replace(dash, "_");
                  }
                  // Un bouton pour mettre en évidence les fields.
                  else if (type === "field") {
                    output = classNode[1].replace("field-name-", "").replace(dash, "_") + " (" + classNode[2].replace(dash, "_") + ")";
                  }
                  // Un bouton pour mettre en évidence l'identifiant des formulaires.
                  else if (type === "form") {
                    output = targetId.replace(dash, "_");
                  }
                  // Un bouton pour mettre en évidence les paragraphs.
                  else if (type === "paragraph") {
                    whithoutParagraph = classNode[1].replace("paragraph--type--", "").replace(dash, "_");
                    classViewMode = /paragraph--view-mode--(\S+)/.exec(targetClass);
                    display = "/" + classViewMode[1].replace(dash, "_");

                    // Ces liens permettent d'aller rapidement à la liste des champs
                    // ou aux modes d'affichage du paragraph.
                    if (login === 1) {
                      link = nToolsHelper.createLink("/admin/structure/paragraphs_type/" + whithoutParagraph + "/fields", "Manage your " + whithoutParagraph + " fields", "F");
                      links.push(link);
                      link = nToolsHelper.createLink("/admin/structure/paragraphs_type/" + whithoutParagraph + "/display" + display, "Manage your " + whithoutParagraph + " displays", "D");
                      links.push(link);
                    }

                    output = whithoutParagraph + " → " + classViewMode[1].replace(dash, "_");
                  }
                  nToolsHelper.addOverlay(this, type, output, links);
                });

                nToolsHelper.addhideAllButton();
              } else {
                nToolsHelper.deleteOverlay(type);
              }
            })
          );
        }
      });
    },

    loginFocus: function () {
      // Autofocus sur le login.
      $("#edit-name").focus();
    },

    styles: function () {
      var sheet = (function () {
        var style = document.createElement("style");
        document.head.appendChild(style);

        return style.sheet;
      })();

      // Pour une meilleure lisibilité, on utilise des backticks pour afficher
      // une règle CSS sur plusieurs lignes (compatible ECMAScript 6).
      var rules = [
        `.page-admin table .odd:hover,
        .page-admin table .even:hover,
        .homebox-column-wrapper table .odd:hover,
        .homebox-column-wrapper table .even:hover {
          background-color: #E1E2DC;
        }
        `,
        `th.filter {
          cursor: pointer;
        }`,
        `.ntools-help,
        .ntools-help * {
          color: #4D8F46;
          font-weight: 900;
        }
        `,
        `.ntools-toggle {
          position: fixed;
          left: 0;
          top: 125px;
          z-index: 900;
        }`,
        `.ntools-toggle button {
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
        }`,
        `.ntools {
          background-color: #202020;
          color: #FFF; min-width: 105px;
          padding: 5px 5px 0 5px;
          position: fixed;
          left: 0;
          top: 149px;
          z-index: 900;
        }`,
        `.ntools * {
          box-sizing: content-box;
          font: 400 14px/18px Helvetica;
        }`,
        `.ntools a {
          color: #0071B3;
        }`,
        `.ntools a:link,
        .ntools a:visited {
          text-decoration: none;
        }`,
        `.ntools a:hover,
        .ntools a:focus {
          color: #018FE2;
        }
        `,
        `.ntools>div {
          margin-bottom: 3px;
          padding-bottom: 2px;
        }
        `,
        `.ntools-user {
          border-bottom: 1px solid #FFF;
        }
        `,
        `#block-masquerade-masquerade,
        .ntools-body-class {
          border-bottom: 1px solid #FFF;
        }
        `,
        `#block-masquerade-masquerade h2 {
          display: none;
        }
        `,
        `#edit-masquerade-user-field,
        #block-masquerade-masquerade input.form-submit {
          border: 1px solid black;
          border-radius: 0;
        }
        `,
        `#block-masquerade-masquerade .content,
        #block-masquerade-masquerade .form-item {
          margin: 0;
        }
        `,
        `#block-masquerade-masquerade .item-list ul li {
          margin: 0;
          padding: 0;
        }
        `,
        `.ntools button {
          border: none;
          border-radius: 0;
          color: #FFF;
          cursor: pointer;
          display: block;
          margin: 0 0 5px;
          padding: 2px 5px;
          width: 93%;
        }
        `,
        `.ntools-regions-toggle {
          background: #018FE2;
        }
        `,
        `.ntools-regions-toggle:hover {
          background: #0073B7;
        }
        `,
        `.ntools-blocks-toggle {
          background: #B73939;
        }
        `,
        `.ntools-blocks-toggle:hover {
          background: #9F2B2B;
        }
        `,
        `.ntools-views-toggle {
          background: #FFA300;
        }
        `,
        `.ntools-views-toggle:hover {
          background: #DA900C;
        }
        `,
        `.ntools-nodes-toggle,
        .ntools-profiles-toggle {
          background: #4D8F46;
        }
        `,
        `.ntools-nodes-toggle:hover,
        .ntools-profiles-toggle:hover {
          background: #277D1E;
        }
        `,
        `.ntools-fields-toggle,
        .ntools-paragraphs-toggle {
          background: #783A00;
        }
        `,
        `.ntools-fields-toggle:hover,
        .ntools-paragraphs-toggle:hover {
          background: #4E2500;
        }
        `,
        `.ntools-forms-toggle {
          background: #4A3657;
        }
        `,
        `.ntools-forms-toggle:hover {
          background: #3B2549;
        }
        `,
        `.ntools-hide-all-toggle {
          background: #000;
        }
        `,
        `.ntools-hide-all-toggle:hover {
          background: #3B3B3B;
        }
        `,
        `.ntools-show {
          position: relative;
        }
        `,
        `.ntools-highlight {
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
        `,
        `.ntools-highlight div {
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
        `,
        `.ntools-highlight a[target="_blank"] {
          background: #000;
          color: #FFF;
          display: inline;
          padding: 0 4px;
        }
        `,
        `.ntools-highlight a[target="_blank"]:hover {
          color: red;
        }
        `,
        `.ntools-region-name {
          background-color: #018FE2;
        }
        `,
        `.ntools-block-name {
          background-color: #B73939;
        }
        `,
        `.ntools-view-name {
          background-color: #FFA300;
        }
        `,
        `.ntools-profile-name,
        .ntools-node-name {
          background-color: #4D8F46;
        }
        `,
        `.ntools-field-name,
        .ntools-paragraph-name {
          background-color: #783A00;
        }
        `,
        `.ntools-form-name {
          background-color: #4A3657;
        }`,
        `.ntools-links a {
          margin-right: 3px;
        }`,
        `.ntools-hidden {
          background: #000;
          border: none;
          color: #FFF;
          cursor: pointer;
          margin-left: 5px;
          padding: 5px;
        }`
      ];

      rules.forEach(function (value, index) {
        try {
          sheet.insertRule(value, index);
        }
        catch (e) {
          console.log(e.message);
        }
      });
    }
  };

  $(function () {
    nTools.styles();

    // Drupal version.
    if (typeof drupalSettings !== "undefined") {
      nTools.drupalVersion = 8;
    } else if (typeof Drupal.themes === "undefined") {
      nTools.drupalVersion = 7;
    } else {
      nTools.drupalVersion = 6;
    }

    // Ajout d'un title avec name/value sur input/textarea/select.
    $("input, textarea, select").each(function () {
      var input = $(this);
      var output = "Name: " + input.attr("name");

      if (input.attr("type") === "checkbox" || input.attr("type") === "radio") {
        output += "\nValue: " + input.val();
      }

      input.attr("title", output);
    });

    // Toutes les <option> ont un title avec leur valeur.
    $("option").each(function () {
      var input = $(this);
      input.attr("title", "Value: " + input.val());
    });

    if ($("body[class*=\"page-admin\"]").length === 1) {
      nTools.backOfficeD7();
    } else if ($("body[class*=\"path-admin\"]").length === 1) {
      nTools.backOfficeD8();
    } else {
      nTools.toolbar();
      nTools.loginFocus();
    }
  });

})(jQuery);
