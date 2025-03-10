//[cms]

function usesBlockTheme() {
  return !!document.querySelector('div.wp-site-blocks');
}

/**
 * Detects the WordPress parent and child theme slugs.
 *
 * See https://core.trac.wordpress.org/changeset/59698.
 *
 * @returns {object} Object with fields `theme` and `parent_theme`.
 */
function getWordPressTheme() {
  const theme = {
    theme: null,
    child_theme: null,
  };
  try {
    const bodyClass = document.body.classList;

    const parentTheme = Array.from( bodyClass ).find( c => c.startsWith( 'wp-theme-' ) );

    if ( parentTheme ) {
      theme.theme = parentTheme.replace( 'wp-theme-', '' );
      theme.child_theme = '';
    }

    const childTheme = Array.from( bodyClass ).find( c => c.startsWith( 'wp-child-theme-' ) );

    if ( childTheme ) {
      theme.child_theme = childTheme.replace( 'wp-child-theme-', '' );
    }

  } catch ( e ) {
    // continue regardless of error
  }
  return theme;
}

// Detects if a WordPress embed block is on the page
function hasWordPressEmbedBlock() {
  return !!document.querySelector('figure.wp-block-embed');
}

// Count the number of WordPress embed blocks on the page, including a breakdown by type
function getWordPressEmbedBlockCounts() {
  const embedBlocks = document.querySelectorAll('figure.wp-block-embed');
  const embedsByType = {};
  for (let embed of embedBlocks) {
    let embedClasses = embed.className.split( ' ' );

    // Find the provider classname, which starts with "is-provider-".
    let provider = embedClasses.find( function( className ) {
      return className.startsWith( 'is-provider-' );
    } );

    if (provider) {
      // Remove the "is-provider-" prefix to get the provider name.
      provider = provider.replace( 'is-provider-', '' );
      embedsByType[ provider ] = embedsByType[ provider ] || 0;
      embedsByType[ provider ]++;
    }
  }

  return {
    total: embedBlocks.length,
    total_by_type: embedsByType
  }
}

/**
 * Obtains data about scripts that WordPress prints on the page.
 *
 * @returns {{}[]}
 */
function getWordPressScripts() {
  const entries = [];

  /**
   * Returns the number of characters in an inline script.
   * Returns null for non-inlined scripts
   *
   * @param {?Element} element Element to examine. May be null.
   */
  const getInlineScriptSize = (element) => {
    if (element instanceof HTMLScriptElement && !element.src) {
      return element.textContent.length;
    }
    return null;
  };

  const scripts = document.querySelectorAll('script[src][id$="-js"]');
  for (const script of scripts) {
    /** @var HTMLScriptElement script */
    const handle = script.id.replace(/-js$/, '');
    entries.push({
      handle,
      src: script.src,
      in_footer: script.parentNode !== document.head,
      async: script.async,
      defer: script.defer,
      intended_strategy: script.dataset.wpStrategy || null,
      // For each external script, check if there is a related inline script
      after_script_size: getInlineScriptSize(document.getElementById(`${handle}-js-after`)),
      before_script_size: getInlineScriptSize(document.getElementById(`${handle}-js-before`)),
      extra_script_size: getInlineScriptSize(document.getElementById(`${handle}-js-extra`)),
      translations_script_size: getInlineScriptSize(document.getElementById(`${handle}-js-translations`)),
    });
  }
  return entries;
}

/**
 * Detects the type of WordPress content for the current document.
 *
 * @returns {object} Object with fields `template`, `post_type`, and `taxonomy`.
 */
function getWordPressContentType() {
  const content = {
    template: 'unknown',
    post_type: '',
    taxonomy: '',
  };
  try {
    const bodyClass = document.body.classList;

    if ( bodyClass.contains( 'home' ) ) {
      /*
       * The home page, either containing the blog,
       * or a "static front page".
       */
      if ( bodyClass.contains( 'blog' ) ) {
        content.template = 'home-blog';
        content.post_type = 'post';
      } else if ( bodyClass.contains( 'page' ) ) {
        content.template = 'home-page';
        content.post_type = 'page';
      }
    } else if ( bodyClass.contains( 'blog' ) ) {
      /*
       * The blog, separate from the home page.
       * Only relevant if the home page contains a "static front page".
       */
      content.template = 'blog';
      content.post_type = 'post';
    } else if ( bodyClass.contains( 'singular' ) ) {
      /*
       * Any singular content (other than the "static front page").
       * Either a page, or content of another post type.
       */
      content.template = 'singular';
      if ( bodyClass.contains( 'page' ) ) {
        content.post_type = 'page';
      } else if ( bodyClass.contains( 'single' ) ) {
        const postTypeClass = Array.from( bodyClass ).find( c => c.startsWith( 'single-' ) && ! c.startsWith( 'single-format-' ) );
        if ( postTypeClass ) {
          content.post_type = postTypeClass.replace( 'single-', '' );
        }
      }
    } else if ( bodyClass.contains( 'archive' ) ) {
      /*
       * Any archive (other than the blog).
       * Either a category archive, a tag archive, a custom post type archive,
       * or a custom taxonomy archive.
       */
      content.template = 'archive';
      if ( bodyClass.contains( 'category' ) ) {
        content.taxonomy = 'category';
      } else if ( bodyClass.contains( 'tag' ) ) {
        content.taxonomy = 'tag';
      } else if ( bodyClass.contains( 'post-type-archive' ) ) {
        const postTypeClass = Array.from( bodyClass ).find( c => c.startsWith( 'post-type-archive-' ) );
        if ( postTypeClass ) {
          content.post_type = postTypeClass.replace( 'post-type-archive-', '' );
        }
      } else {
        const taxonomyClass = Array.from( bodyClass ).find( c => c.startsWith( 'tax-' ) );
        if ( taxonomyClass ) {
          content.taxonomy = taxonomyClass.replace( 'tax-', '' );
        }
      }
    }
  } catch ( e ) {
    // continue regardless of error
  }
  return content;
}

/**
 * Obtains data about Interactivity API usage on the page.
 *
 * @returns {object} Object with fields `total_regions` and `total_regions_by_namespace`.
 */
function getInteractivityAPIUsage() {
  // Look for data-wp-interactive regions.
  const interactiveRegions = document.querySelectorAll('[data-wp-interactive]');

  // Count the regions by namespace.
  const regionNamespaceCounts = {};
  interactiveRegions.forEach( region => {
    // Extract the namespace from JSON or as a string
    let namespace = '';
    const regionAttribute = region.getAttribute('data-wp-interactive');
    try {
      const regionData = JSON.parse( regionAttribute );
      if ( regionData.namespace && 'string' === typeof regionData.namespace ) {
        namespace = regionData.namespace;
      }
    } catch ( e ) {
      namespace = regionAttribute;
    }
    if ( 'string' === typeof namespace && '' !== namespace ) {
      regionNamespaceCounts[ namespace ] = ( regionNamespaceCounts[ namespace ] || 0 ) + 1;
    }
  })

  return {
    total_regions: interactiveRegions.length,
    total_regions_by_namespace: regionNamespaceCounts,
  };
}

/**
 * Check if the page uses the interactivity API.
 *
 * @returns {boolean} Whether any interactivity API regions are present.
 */
function usesInteractivityAPI() {
  return !!document.querySelector('[data-wp-interactive]');
}

const wordpress = {
  theme: getWordPressTheme(),
  block_theme: usesBlockTheme(),
  has_embed_block: hasWordPressEmbedBlock(),
  embed_block_count: getWordPressEmbedBlockCounts(),
  scripts: getWordPressScripts(),
  content_type: getWordPressContentType(),
  uses_interactivity_api: usesInteractivityAPI(),
  interactivity_api_usage: getInteractivityAPIUsage(),
};

return {
  wordpress
};
