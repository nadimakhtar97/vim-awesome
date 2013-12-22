/** @jsx React.DOM */
(function() {
"use strict";

// TODO(david): We might want to split up this file eventually.

var D_KEYCODE = 'D'.charCodeAt(0),
    G_KEYCODE = 'G'.charCodeAt(0),
    H_KEYCODE = 'H'.charCodeAt(0),
    J_KEYCODE = 'J'.charCodeAt(0),
    K_KEYCODE = 'K'.charCodeAt(0),
    L_KEYCODE = 'L'.charCodeAt(0),
    U_KEYCODE = 'U'.charCodeAt(0),
    ENTER_KEYCODE = 13;

// A cache of all tag IDs and their counts.
var allTags = {};

var clamp = function(num, min, max) {
  return Math.min(Math.max(num, min), max);
};

var capitalizeFirstLetter = function(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Adapted from http://stackoverflow.com/a/2880929/392426
var getQueryParams = function() {
  var match,
      pl     = /\+/g,  // Regex for replacing addition symbol with a space
      search = /([^&=]+)=?([^&]*)/g,
      decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
      query  = window.location.search.substring(1),
      urlParams = {};

  while ((match = search.exec(query))) {
    urlParams[decode(match[1])] = decode(match[2]);
  }

  return urlParams;
};

// TODO(david): Make this show at least 100px above/below the node (ie. Vim's
//     'scrolloff').
var scrollToNode = function(domNode) {
  var windowTop = $(window).scrollTop();
  var windowBottom = $(window).height() + windowTop;
  var elementTop = $(domNode).offset().top;
  var elementBottom = elementTop + $(domNode).height();

  if (elementBottom > windowBottom) {
    domNode.scrollIntoView(false /* alignWithTop */);
  } else if (elementTop < windowTop) {
    domNode.scrollIntoView(true /* alignWithTop */);
  }
};

var Sidebar = React.createClass({
  render: function() {
    var categories = _.map([
      "Language",
      "Syntax",
      "Navigation",
      "Movement",
      "Buffer",
      "Info",
      "Integrations"
    ], function(category) {
      return <li key={category}>
        <a href="#/blah"><i className="icon-fighter-jet"></i> {category}</a>
      </li>;
    });

    return <div className="sidebar">
      <h1 className="title">
        <a href="/">
          <span className="vim">Vim</span>Awesome
        </a>
      </h1>
      <div className="tac">
        <div className="subtitle">
          <div className="line1">Awesome Vim plugins</div>
          <div className="from">from</div>
          <div className="line2">across the Universe</div>
        </div>
      </div>
      <ul className="categories">{categories}</ul>
    </div>;
  }
});

var SearchBox = React.createClass({
  componentDidMount: function() {
    window.addEventListener("keyup", this.windowKeyUp, false);
  },

  componentWillUnmount: function() {
    window.removeEventListener("keyup", this.windowKeyUp, false);
  },

  windowKeyUp: function(e) {
    var tag = e.target.tagName;
    var key = e.keyCode;
    if (tag !== "INPUT" && tag !== "TEXTAREA" &&
        key === 191 /* forward slash */) {
      this.refs.input.getDOMNode().focus();
      this.props.onFocus();
    }
  },

  handleKeyUp: function(e) {
    if (e.nativeEvent.keyCode === 27 /* escape */) {
      this.refs.input.getDOMNode().blur();
    }
  },

  onChange: function(e) {
    this.props.onChange(this.refs.input.getDOMNode().value);
  },

  render: function() {
    return <div className="search-container">
      <i className="icon-search"></i>
      <input type="text" className="search" placeholder="Search" ref="input"
          value={this.props.searchQuery} onChange={this.onChange}
          onKeyUp={this.handleKeyUp} />
    </div>;
  }
});

var Pager = React.createClass({
  propTypes: {
    currentPage: React.PropTypes.number.isRequired,
    totalPages: React.PropTypes.number.isRequired
  },

  componentDidMount: function() {
    window.addEventListener("keyup", this.onWindowKeyDown, false);
  },

  componentWillUnmount: function() {
    window.removeEventListener("keyup", this.onWindowKeyDown, false);
  },

  onWindowKeyDown: function(e) {
    var tag = e.target.tagName;
    var key = e.keyCode;

    if (tag !== "INPUT" && tag !== "TEXTAREA") {
      if (key === H_KEYCODE) {
        this.goToPrevPage();
      } else if (key === L_KEYCODE) {
        this.goToNextPage();
      }
    }
  },

  goToPage: function(page) {
    var newPage = clamp(page, 1, this.props.totalPages);
    this.props.onPageChange(newPage);
  },

  goToPrevPage: function() {
    this.goToPage(this.props.currentPage - 1);
  },

  goToNextPage: function() {
    this.goToPage(this.props.currentPage + 1);
  },

  onPrevClick: function(e) {
    e.preventDefault();
    this.goToPrevPage();
  },

  onNextClick: function(e) {
    e.preventDefault();
    this.goToNextPage();
  },

  render: function() {
    var currentPage = this.props.currentPage;
    var totalPages = this.props.totalPages;

    if (totalPages <= 1) {
      return <div />;
    }

    // TODO(david): Have buttons for page numbers, including first page, last
    //     page, and current page.
    return <div className="pagination">
      <ul>
        {currentPage > 1 &&
          <li>
            <a className="pager-button prev-page-button" href="#"
                onClick={this.onPrevClick}>
              {"\u2190"} <code>H</code>
            </a>
          </li>
        }
        <li>
          <a className="page-number">Page {currentPage} of {totalPages}</a>
        </li>
        {currentPage < totalPages &&
          <li>
            <a className="pager-button next-page-button" href="#"
                onClick={this.onNextClick}>
              <code>L</code> Next page
              <span className="right-arrow">{"\u2192"}</span>
            </a>
          </li>
        }
      </ul>
    </div>;
  }
});

var Plugin = React.createClass({
  goToDetailsPage: function() {
    Backbone.history.navigate("plugin/" + this.props.plugin.name, true);
  },

  render: function() {
    // TODO(david): Animations on initial render
    var plugin = this.props.plugin;
    if (!plugin || !plugin.name) return <li className="plugin"></li>;

    var hasNavFocus = this.props.hasNavFocus;
    // TODO(david): Map color from tag/category or just hash of name
    var color = "accent-" + (plugin.name.charCodeAt(0) % 9);
    return <li
        className={"plugin" + (hasNavFocus ? " nav-focus" : "")}
        onMouseEnter={this.props.onMouseEnter}>
      <a href={"plugin/" + plugin.name}>
        <h3 className={"plugin-name " + color}>{plugin.name}</h3>
        {plugin.author && <span className="by">by</span>}
        {plugin.author && <span className="author">{" " + plugin.author}</span>}
        {plugin.github_stars > 0 && <div className="github-stars">
          {plugin.github_stars} <i className="icon-star"></i>
        </div>}
        <p className="short-desc">
          {plugin.github_short_desc || plugin.vimorg_short_desc}
        </p>
      </a>
    </li>;
  }
});

var PluginList = React.createClass({
  getInitialState: function() {
    return {
      plugins: [],
      selectedIndex: -1,
      hoverDisabled: false
    };
  },

  componentDidMount: function() {
    this.fetchPlugins(this.props);
    window.addEventListener("keydown", this.onWindowKeyDown, false);
  },

  componentWillReceiveProps: function(nextProps) {
    if (nextProps.searchQuery !== this.props.searchQuery) {
      this.fetchPluginsDebounced(nextProps);
    } else if (nextProps.currentPage !== this.props.currentPage) {
      this.fetchPluginsThrottled(nextProps);
    }
  },

  shouldComponentUpdate: function(nextProps, nextState) {
    // Only re-render when new plugins have been fetched.
    // TODO(david): But we still want to grey-out and show a loading spinner
    //     when fetching.
    return !_.isEqual(nextState, this.state);
  },

  componentDidUpdate: function(prevProps) {
    // Scroll to the navigated plugin if available
    if (this.refs && this.refs.navFocus) {
      scrollToNode(this.refs.navFocus.getDOMNode());
    }
  },

  componentWillUnmount: function() {
    window.removeEventListener("keydown", this.onWindowKeyDown, false);
  },

  resetSelection: function() {
    if (this.state.selectedIndex !== -1) {
      this.setState({selectedIndex: -1});
    }
  },

  onWindowKeyDown: function(e) {
    // TODO(david): Duplicated code from SearchBox
    var tag = e.target.tagName;
    var key = e.keyCode;

    if (tag !== "INPUT" && tag !== "TEXTAREA") {
      if (key === J_KEYCODE || key === K_KEYCODE) {
        // Go to next or previous plugin
        var direction = (key === J_KEYCODE ? 1 : -1);
        var maxIndex = this.state.plugins.length - 1;
        var newIndex = clamp(this.state.selectedIndex + direction, 0, maxIndex);

        // Disable hover when navigating plugins, because when the screen scrolls,
        // a MouseEnter event will be fired if the mouse is over a plugin, causing
        // the selection to jump back.
        this.setState({selectedIndex: newIndex, hoverDisabled: true});

        // Re-enable hover after a delay
        clearTimeout(this.reenableHoverTimeout);
        this.reenableHoverTimeout = setTimeout(function() {
          this.setState({hoverDisabled: false});
        }.bind(this), 100);

      } else if (key === ENTER_KEYCODE && this.refs && this.refs.navFocus) {
        e.preventDefault();
        this.refs.navFocus.goToDetailsPage();
      }
    }
  },

  onPluginMouseEnter: function(index, e) {
    // TODO(david): This is not as quick/snappy as CSS :hover ...
    if (this.state.hoverDisabled) return;
    this.setState({selectedIndex: index});
  },

  fetchPlugins: function(params) {
    // Abort any pending XHRs so that we don't update from a stale query.
    if (this.fetchPluginsXhr) {
      this.fetchPluginsXhr.abort();
    }

    this.fetchPluginsXhr = $.ajax({
      url: "/api/plugins",
      dataType: "json",
      data: {
        query: params.searchQuery,
        page: params.currentPage
      },
      success: this.onPluginsFetched
    });
  },

  onPluginsFetched: function(data) {
    this.setState({
      plugins: data.plugins,
      totalPages: data.total_pages
    });

    // TODO(david): Give this prop a default value.
    this.props.onPluginsFetched();

    if (this.state.selectedIndex !== -1) {
      this.setState({selectedIndex: 0});
    }
  },

  fetchPluginsDebounced: _.debounce(function() {
    this.fetchPlugins.apply(this, arguments);
  }, 300),

  fetchPluginsThrottled: _.throttle(function() {
    this.fetchPlugins.apply(this, arguments);
  }, 500),

  render: function() {
    var query = this.props.searchQuery.toLowerCase();
    var plugins = _.chain(this.state.plugins)
      .map(function(plugin, index) {
        var hasNavFocus = (index === this.state.selectedIndex);
        return <Plugin
            ref={hasNavFocus ? "navFocus" : ""}
            key={plugin.id}
            hasNavFocus={hasNavFocus}
            plugin={plugin}
            onMouseEnter={this.onPluginMouseEnter.bind(this, index)} />;
      }, this)
      .value();
    var totalPages = this.state.totalPages || 0;

    // TODO(david): Figure out a way to not update the page number until the
    //     request has returned.
    return <div>
      <ul className="plugins">{plugins}</ul>
      <Pager currentPage={this.props.currentPage}
          totalPages={totalPages} onPageChange={this.props.onPageChange} />
    </div>;
  }
});

// Instructions for installing a plugin with Vundle.
var VundleInstructions = React.createClass({
  render: function() {
    var urlPath = (this.props.github_url || "").replace(
        /^https?:\/\/github.com\//, "");
    var vundleUri = urlPath.replace(/^vim-scripts\//, "");

    return <div>
      <p>Place this in your <code>.vimrc:</code></p>
      <pre>Bundle '{vundleUri}'</pre>
      <p>&hellip; then run the following in Vim:</p>
      <pre>:source %<br/>:BundleInstall</pre>
      {/* Hack to get triple-click in Chrome to not over-select. */}
      <div>{'\u00a0' /* &nbsp; */}</div>
    </div>;
  }
});

// Instructions for installing a plugin with Pathogen.
var PathogenInstructions = React.createClass({
  render: function() {
    return <div>
      <p>Run the following in a terminal:</p>
      <pre>cd ~/.vim/bundle<br/>git clone {this.props.github_url}
      </pre>
      {/* Hack to get triple-click in Chrome to not over-select. */}
      <div>{'\u00a0' /* &nbsp; */}</div>
    </div>;
  }
});

// Instructions for installing a plugin manually (downloading an archive).
var ManualInstructions = React.createClass({
  render: function() {
    return <div>
      TODO: How to install manually
    </div>;
  }
});

// Help text explaining what Vundle is and linking to more details.
var VundleTabPopover = React.createClass({
  render: function() {
    return <div>
      Vundle is short for Vim Bundle and is a plugin manager for Vim.
      <br/><br/>See
      <a href="https://github.com/gmarik/vundle" target="_blank">
        <i className="icon-github" /> gmarik/vundle
      </a>
    </div>;
  }
});

// Help text explaining what Pathogen is and linking to more details.
var PathogenTabPopover = React.createClass({
  render: function() {
    return <div>
      Pathogen makes it super easy to install plugins and runtime files
      in their own private directories.
      <br/><br/>See
      <a href="https://github.com/tpope/vim-pathogen" target="_blank">
        <i className="icon-github" /> tpope/vim-pathogen
      </a>
    </div>;
  }
});

// The installation instructions (via Vundle, etc.) widget on the details page.
var Install = React.createClass({
  getInitialState: function() {
    return {
      tabActive: "vundle"
    };
  },

  componentDidMount: function() {
    if (window.localStorage && window.localStorage["installTab"]) {
      this.setState({tabActive: window.localStorage["installTab"]});
    }

    var popovers = {
      vundleTab: <VundleTabPopover />,
      pathogenTab: <PathogenTabPopover />
    };

    var self = this;
    _.each(popovers, function(component, ref) {
      React.renderComponentToString(component, function(markup) {
        var $tabElem = $(self.refs[ref].getDOMNode());
        $tabElem.popover({
          html: true,
          content: markup,
          placement: "left",
          animation: false,
          trigger: "hover",
          container: $tabElem
        });
      });
    });
  },

  onTabClick: function(installMethod) {
    this.setState({tabActive: installMethod});
    if (window.localStorage) {
      window.localStorage["installTab"] = installMethod;
    }
  },

  render: function() {
    return <div className="install row-fluid">
      <div className="tabs-column">
        <h3 className="install-label">Install from</h3>
        <ul className="install-tabs">
          <li onClick={this.onTabClick.bind(this, "vundle")} ref="vundleTab"
              className={this.state.tabActive === "vundle" ? "active" : ""}>
            Vundle
          </li>
          <li onClick={this.onTabClick.bind(this, "pathogen")} ref="pathogenTab"
              className={this.state.tabActive === "pathogen" ? "active" : ""}>
            Pathogen
          </li>
          <li onClick={this.onTabClick.bind(this, "manual")}
              className={this.state.tabActive === "manual" ? "active" : ""}>
            Archive
          </li>
        </ul>
      </div>
      <div className="content-column">
        {this.state.tabActive === "vundle" &&
            <VundleInstructions github_url={this.props.github_url} />}
        {this.state.tabActive === "pathogen" &&
            <PathogenInstructions github_url={this.props.github_url} />}
        {this.state.tabActive === "manual" && <ManualInstructions />}
      </div>
    </div>;
  }
});

// This is the tags widget on the details page.
var Tags = React.createClass({
  getInitialState: function() {
    return {
      isEditing: false
    };
  },

  componentDidMount: function() {
    this.fetchAllTags();
  },

  componentDidUpdate: function() {
    if (this.refs && this.refs.tagInput) {
      var $input = $(this.refs.tagInput.getDOMNode());
      $input.focus();
      this.initTypeahead($input);
    }
  },

  initTypeahead: function($input) {
    // Uses Bootstrap's lightweight typeahead:
    // http://getbootstrap.com/2.3.2/javascript.html#typeahead
    $input.typeahead({
      source: _.keys(allTags),

      sorter: function(items) {
        return _.sortBy(items, function(tagId) {
          return -allTags[tagId].count;
        });
      },

      highlighter: function(item) {
        var Typeahead = $.fn.typeahead.Constructor;
        var tagName = capitalizeFirstLetter(item);
        var highlighted = Typeahead.prototype.highlighter.call(this, tagName);
        return highlighted + "<span class=\"count\">&times; " +
            allTags[item].count + "</span>";
      },

      updater: function(item) {
        return capitalizeFirstLetter(item);
      }
    });
  },

  fetchAllTags: function() {
    if (!_.isEmpty(allTags)) return;

    $.getJSON("/api/tags", function(data) {
      allTags = {};
      _.each(data, function(tag) {
        allTags[tag.id] = tag;
      });
    });
  },

  onEditBtnClick: function() {
    this.setState({isEditing: true});
  },

  onDoneBtnClick: function() {
    this.setState({isEditing: false});
  },

  onRemoveBtnClick: function(tag, e) {
    this.props.onTagsChange(_.without(this.props.tags, tag));
  },

  onKeyUp: function(e) {
    var key = e.keyCode;
    if (key === 13 /* enter */ || key === 9 /* tab */ ||
        key === 188 /* comma */) {
      var $input = $(this.refs.tagInput.getDOMNode());
      // TODO(david): This needs to use autocomplete
      var tagId = $input.val().replace(/,$/, "").toLowerCase();
      if (!tagId) return;
      $input.val("");
      this.props.onTagsChange(this.props.tags.concat(tagId));
    }
  },

  render: function() {
    var MAX_TAGS = 5;

    var actionBtn;
    if (this.state.isEditing) {
      actionBtn = <button
          onClick={this.onDoneBtnClick} className="action-btn done-btn">
        <i className="icon-check"></i> Done
      </button>;
    } else {
      actionBtn = <button
          onClick={this.onEditBtnClick} className="action-btn edit-btn">
        <i className="icon-edit"></i> Edit
      </button>;
    }

    var tags = _.map(this.props.tags, function(tag) {
      // TODO(david): Should get tag name from map of tags that we send down.
      var tagName = capitalizeFirstLetter(tag);
      return <li key={tag} className="tag">
        <a className="tag-link" href={"/tags/" + tag}>{tagName}</a>
        <i onClick={this.onRemoveBtnClick.bind(this, tag)}
            className="icon-remove-sign remove-btn"></i>
      </li>;
    }.bind(this));

    // TODO(david): Tags should be colored appropriately
    return <div className={"tags" + (this.state.isEditing ? " editing" : "")}>
      <h3 className="tags-label">Tags</h3>
      <ul className="tags-list">{tags}</ul>
      {this.state.isEditing && this.props.tags.length < MAX_TAGS &&
          <input ref="tagInput" onKeyUp={this.onKeyUp} type="text"
             maxLength="12" className="tag-input" placeholder="Add tag" />}
      {actionBtn}
    </div>;
  }
});

var Markdown = React.createClass({
  render: function() {
    return <div
        dangerouslySetInnerHTML={{__html: marked(this.props.children)}} />;
  }
});

// Permalink page with more details about a plugin.
var PluginPage = React.createClass({
  getInitialState: function() {
    return {
      // TODO(david): placeholders
      created_at: 1286809444,
      updated_at: 1371265409
    };
  },

  componentDidMount: function() {
    this.fetchPlugin();
    window.addEventListener("keydown", this.onWindowKeyDown, false);
  },

  componentWillUnmount: function() {
    window.removeEventListener("keydown", this.onWindowKeyDown, false);
  },

  fetchPlugin: function() {
    $.getJSON("/api/plugins/" + this.props.name, function(data) {
      this.setState(data);
    }.bind(this));
  },

  // TODO(david): Maybe use keypress?
  onWindowKeyDown: function(e) {
    var key = e.keyCode;
    var direction;
    var gPressed = (key === G_KEYCODE && !e.altKey && !e.ctrlKey &&
        !e.shiftKey && !e.metaKey);

    if (key === J_KEYCODE || key === K_KEYCODE) {
      // Scroll page in small increments with j/k.
      direction = (key === J_KEYCODE ? 1 : -1);
      window.scrollBy(0, direction * 100);
    } else if (key === U_KEYCODE || key === D_KEYCODE) {
      // Scroll page in large increments with u/d.
      direction = (key === D_KEYCODE ? 1 : -1);
      window.scrollBy(0, direction * 400);
    } else if (key === G_KEYCODE && e.shiftKey) {
      // Scroll to bottom of page with shift+G.
      window.scrollTo(0, $(document).height());
    } else if (this.gLastPressed && gPressed) {
      // Scroll to top of page with gg (or by holding down g (yes this is what
      // Vim does as well -- TIL)).
      window.scrollTo(0, 0);
    }

    this.gLastPressed = gPressed;
  },

  // TODO(david): Should we adopt the "handleTagsChange" naming convention?
  onTagsChange: function(tags) {
    var newTags = _.uniq(tags);
    this.setState({tags: newTags});
    $.ajax({
      url: "/api/plugins/" + this.props.name + "/tags",
      type: "POST",
      contentType: "application/json",
      dataType: "json",
      data: JSON.stringify({tags: newTags}),
      success: function(data) {
        this.setState({tags: data.tags})
      }.bind(this)
    });
  },

  render: function() {
    var longDesc;

    // For rendering long description, prefer GitHub's README if it's not from
    // the vim-scripts mirror.
    if (this.state.github_readme &&
        this.state.github_url.indexOf("github.com/vim-scripts") === -1) {
      longDesc = this.state.github_readme;
    } else {
      longDesc = this.state.vimorg_long_desc || this.state.github_readme || "";
    }

    // TODO(david): Need to also scrape the link to the archive download (for
    //     the manual install mode).
    var installDetails = this.state.vimorg_install_details;

    // TODO(david): What to do for scripts that don't have a vim.org
    //     submission?
    var vimOrgUrl = "http://www.vim.org/scripts/script.php?script_id=" +
        encodeURIComponent(this.state.vim_script_id);

    return <div className="plugin-page">
      <Plugin plugin={this.state} />

      <div className="row-fluid">
        <div className="span9 accent-box dates">
          <div className="row-fluid">
            <div className="span6">
              <h3 className="date-label">Created</h3>
              <div className="date-value">
                {moment(this.state.created_at * 1000).fromNow()}
              </div>
            </div>
            <div className="span6">
              <h3 className="date-label">Updated</h3>
              <div className="date-value">
                {moment(this.state.updated_at * 1000).fromNow()}
              </div>
            </div>
          </div>
        </div>
        <div className="span3 accent-box links">
          <a href={vimOrgUrl} target="_blank" className="vim-link">
            <i className="vim-icon dark"></i>
            <i className="vim-icon light"></i>
            Vim.org
          </a>
          <a href={this.state.github_url} target="_blank" className="github-link">
            <i className="github-icon dark"></i>
            <i className="github-icon light"></i>
            GitHub
          </a>
        </div>
      </div>

      <div className="row-fluid">
        <div className="span9">
          <Install github_url={this.state.github_url} />
        </div>
        <div className="span3">
          <Tags tags={this.state.tags} onTagsChange={this.onTagsChange} />
        </div>
      </div>

      <div className="row-fluid">
        <div className="span12 long-desc">
          <Markdown>{longDesc}</Markdown>
          {!!installDetails &&
            <div>
              <h2>Installation</h2>
              <Markdown>{installDetails}</Markdown>
            </div>
          }
        </div>
      </div>

    </div>;
  }
});

var PluginListPage = React.createClass({
  // TODO(david): What happens if user goes to non-existent page?
  // TODO(david): Update title so that user has meaningful history entries.

  getInitialState: function() {
    return this.getStateFromUrl();
  },

  componentDidMount: function() {
    window.addEventListener("popstate", this.onWindowPopstate, false);
  },

  componentWillUnmount: function() {
    window.removeEventListener("popstate", this.onWindowPopstate, false);
  },

  onWindowPopstate: function() {
    // TODO(david): pushState previous results so we don't re-fetch. Or, set up
    //     a jQuery AJAX hook to cache all GET requests!!!! That will help with
    //     so many things!!! (But make sure not to exceed a memory threshold.)
    this.setState(this.getStateFromUrl());
  },

  onSearchFocus: function() {
    this.refs.pluginList.resetSelection();
  },

  onSearchChange: function(query) {
    this.setState({
      searchQuery: query,
      currentPage: 1
    });
    this.refs.pluginList.resetSelection();
  },

  getStateFromUrl: function() {
    var queryParams = getQueryParams();
    var currentPage = +(queryParams.p || 1);

    return {
      currentPage: currentPage,
      searchQuery: queryParams.q || ""
    };
  },

  updateUrlFromState: function() {
    var queryObject = {};

    if (this.state.currentPage !== 1) {
      queryObject.p = this.state.currentPage;
    }

    if (this.state.searchQuery) {
      queryObject.q = this.state.searchQuery;
    }

    var queryParams = $.param(queryObject);
    var path = queryParams ? '?' + queryParams : '';
    Backbone.history.navigate(path);
  },

  onPluginsFetched: function() {
    // Update the URL when the page content has been updated if necessary.
    if (!_.isEqual(this.getStateFromUrl(), this.state)) {
      this.updateUrlFromState();
    }

    // Scroll to top
    window.scrollTo(0, 0);
  },

  onPageChange: function(page) {
    this.setState({currentPage: page});
  },

  render: function() {
    return <div>
      <SearchBox searchQuery={this.state.searchQuery}
          onChange={this.onSearchChange} onFocus={this.onSearchFocus} />
      <div className="keyboard-tips">
        Tip: use <code>/</code> to search and
        <code>ESC</code>, <code>J</code>/<code>K</code>,
        <code>H</code>/<code>L</code> to navigate
      </div>
      <PluginList ref="pluginList" searchQuery={this.state.searchQuery}
          currentPage={this.state.currentPage}
          onPluginsFetched={this.onPluginsFetched}
          onPageChange={this.onPageChange} />
    </div>;
  }
});

var Page = React.createClass({
  render: function() {
    return <div className="page-container">
      <Sidebar />
      <div className="content">
        {this.props.content}
      </div>
    </div>;
  }
});

// TODO(alpert): Get rid of Backbone?
var Router = Backbone.Router.extend({
  routes: {
    "": "home",
    "plugin/:name": "plugin"
  },

  _showPage: function(component) {
    React.renderComponent(<Page content={component} />, document.body);
  },

  home: function() {
    this._showPage(<PluginListPage />);
  },

  plugin: function(name) {
    this._showPage(<PluginPage name={name} />);
  }
});

new Router();
Backbone.history.start({pushState: true});

// Hijack internal nav links to use Backbone router to navigate between pages
// Adapted from https://gist.github.com/tbranyen/1142129
if (Backbone.history && Backbone.history._hasPushState) {
  $(document).on("click", "a", function(evt) {
    var href = $(this).attr("href");
    var protocol = this.protocol + "//";

    // Only hijack URL to use Backbone router if it's relative (internal link)
    // and not a hash fragment.
    if (href && href.substr(0, protocol.length) !== protocol &&
        href[0] !== '#') {
      evt.preventDefault();
      Backbone.history.navigate(href, true);

      // Scroll to top. Chrome has this weird issue where it will retain the
      // current scroll position, even if it's beyond the document's height.
      window.scrollTo(0, 0);
    }
  });
}

})();
