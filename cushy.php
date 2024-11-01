<?php
/*
Plugin Name: Cushy.com User Content
Plugin URI: https://github.com/dolphinfoundry/cushy
Description: a plugin to get your specific cushy.com user content into your blogs.
Version: 2.0
Author: foogyllis, reachsuman, Jayakumar, aditya
Author URI: http://cushy.com
License: GPL2
*/

global $cushy_db_version;
$cushy_db_version = "1.0";
$is_dubug         = false;
$endpoint         = ($is_dubug) ? '192.168.0.106:4200' : 'cushy.com';
define('CUSHY_WP_BASE_URL', 'https://' . $endpoint);
define('CUSHY_WP_PLUGIN_URL', plugin_dir_url(__FILE__));

class cushy_shortcode{

    public $shortcode_tag = 'cushy_card';

    /* Class constructor sets the filter and action hooks*/
    function __construct($args = array()){
        //add shortcode
        add_shortcode( $this->shortcode_tag, array( $this, 'cushy_shortcode_handler' ) );

        if ( is_admin() ){
            add_action('admin_head', array( $this, 'admin_head') );
            add_action( 'external_scripts', array($this , 'external_scripts' ) );
        }
    }

    /* Shortcode handler */
    function cushy_shortcode_handler($atts , $content = null){
        if (count($atts) > 0 && isset($atts['id'])) {
            $cushy_caption = $atts['caption'];
            $cushy_id   = $atts['id'];
            $img_data   = (isset($atts['img_data'])) ? explode("x", $atts['img_data']) : array();
            $img_width  = (isset($img_data[0])) ? $img_data[0] : "100";
            $img_height = (isset($img_data[1])) ? $img_data[1] : "100";

            $cushy_card = '<div id="iframe-content-' . esc_attr($atts['id']) . '" class="iframe-content" style="border: 1px solid rgb(219, 219, 219); position: relative; left: 0px; width: 100%; height: auto; z-index: 99;">
                        <div class="iframe-pre-loader" style="display: block; height: 100%; width: 100%; background: #D8D8D8 url(' . esc_url(CUSHY_WP_PLUGIN_URL . 'assets/loader.png') . ') no-repeat center center; background-size: initial; position: absolute; left: 0; top: 0; z-index: 100;"></div>
                        <iframe scrolling="no" seamless="seamless" id="' . esc_attr($atts['id']) . '" class="cushy-iframe embed-responsive-item" src="' . esc_url(CUSHY_WP_BASE_URL . '/o/blog/' . $atts['id']) . '" frameborder="0" allowfullscreen style="background-color: #F8F8F8;border: solid 1px #e1e1e1;overflow: hidden; height: 100%; width: calc(100%);"></iframe>
                        </div>';
            $cushy_card .= '<script src="https://code.jquery.com/jquery-3.2.1.min.js"></script>';
            $cushy_card .= '<script src="' . esc_js(CUSHY_WP_PLUGIN_URL . 'js/cushy.js?v=' . time()) . '"></script>';
            $cushy_card .= '<script>
                           /*** Set Iframe aspect 
                           * ratio on initiazlise ***/
                           $.fn.initIframeContent = function(imgWidth, imgHeight, sectionWidth) {
                             $(".cushy-card").css("display", "block");
                             var cushyId = \'' . $cushy_id . '\';
                             var desc = \'" . $cushy_caption . "\';
                             var descLength = desc.length;
                             var descElementHeight = (desc !== "") ? 20 : 20;
                             var baseLineHeight = 60;
                             if(descLength > 60) {
                                 descElementHeight = Math.round((descLength/baseLineHeight) * descElementHeight);
                             }

                             var sectionHeight = $(document).find(".entry-content").innerHeight();
                             
                             var iframeHeight = (imgHeight/imgWidth * sectionWidth) ;
                             iframeHeight = Math.round(iframeHeight) + descElementHeight + 140;
                             
                             $("#iframe-content-" + cushyId).css({"border": "solid 1px #e1e1e1;", "width": sectionWidth + "px", "height": iframeHeight + "px", "max-width": sectionWidth + "px"});
                             
                             document.getElementById(\'' . $cushy_id . '\').onload= function() {
                                $("#iframe-content-" + \'' . $cushy_id . '\').find(".iframe-pre-loader").fadeOut();
                                $(document).find(".cushy-preview").remove();
                             };
                           }
                           
                            var imgWidth = ' . $img_width . ';
                            var imgHeight = ' . $img_height . ';
                            var sectionWidth = Math.round($(document).find(".entry-content").innerWidth());
                            
                            $.fn.initIframeContent(imgWidth, imgHeight, sectionWidth);
                            
                            $(window).resize(function () {
                                $.fn.initIframeContent(imgWidth, imgHeight, sectionWidth);
                            })
                      </script>';
        } else
            $cushy_card = "";

        return $cushy_card;
    }


    /* calls functions into the filters */
    function admin_head() {

        if ( !current_user_can( 'edit_posts' ) && !current_user_can( 'edit_pages' ) ) {
            return;
        }

        if ( 'true' == get_user_option( 'rich_editing' ) ) {
            add_filter( 'mce_external_plugins', array( $this ,'mce_external_plugins' ) );
        }
    }

    /* Adds tinymce plugin */
    function mce_external_plugins( $plugin_array ) {
        $plugin_array[$this->shortcode_tag] = plugins_url();
        return $plugin_array;
    }

    /* Custom style css */
    function external_scripts(){
        wp_enqueue_style('cushy_card_shortcode', plugins_url( 'css/cushy.min.css' , __FILE__ ) );
    }


}//end class

// Initialize the cushy short-code
new cushy_shortcode();

/*Create table when plugin is added */
function cushy_create_db() {
    global $wpdb;
    $charset_collate = $wpdb->get_charset_collate();
    $table_name      = $wpdb->prefix . 'my_analysis';

    $sql = "CREATE TABLE $table_name (
        id mediumint(9) NOT NULL AUTO_INCREMENT,
        time datetime DEFAULT '0000-00-00 00:00:00' NOT NULL,
        views smallint(5) NOT NULL,
        clicks smallint(5) NOT NULL,
        UNIQUE KEY id (id)
    ) $charset_collate;";

    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql);
}

register_activation_hook(__FILE__, 'cushy_create_db');

function cushy_install() {
    global $wpdb;
    global $cushy_db_version;

    $table_name = $wpdb->prefix . "cushy_settings";

    $sql = "CREATE TABLE IF NOT EXISTS $table_name (
      id int(11) NOT NULL AUTO_INCREMENT,
      user_uuid varchar(80) NOT NULL,
      user_display_name varchar(80) NOT NULL,
      url text NOT NULL,
      UNIQUE KEY id (id)
    ) ENGINE=InnoDB  DEFAULT COLLATE=latin1_general_ci;";


    #exit($sql);

    $wpdb->query($sql);
}

register_activation_hook(__FILE__, 'cushy_install');

/* drop table when plugin is deactivated */
function cushy_remove_settings_table() {
    global $wpdb;
    $table_name = $wpdb->prefix . "cushy_settings";
    $sql        = "DROP TABLE IF EXISTS $table_name;";
    $wpdb->query($sql);
    delete_option("cushy_plugin_db_version");
}

register_deactivation_hook(__FILE__, 'cushy_remove_settings_table');

/* External file includes */
function cushy_include_files() {
    wp_enqueue_style('cushy', CUSHY_WP_PLUGIN_URL . 'css/cushy.min.css', false, '1.0' . time());
    wp_enqueue_script('cushy', CUSHY_WP_PLUGIN_URL . 'js/cushy.js', array(), '1.0.' . time(), true);
    wp_enqueue_script('firebase', 'https://www.gstatic.com/firebasejs/4.1.0/firebase.js', array(), null, false);
    wp_enqueue_script('firebase', 'https://apis.google.com/js/platform.js', array(), '1.0.', false);


}

/* Add cushy settings to menu */
function cushy_settings_menu() {
    if (!session_id()) session_start();
    cushy_include_files();
    add_menu_page('Cushy Settings Page', 'Cushy Settings', 'manage_options', 'cushy-settings', 'cushy_settings');
}

add_action('admin_menu', 'cushy_settings_menu');

/* Cushy credential settings */
function cushy_settings() {
    cushy_include_files();
    ?>

    <div class="wrap">
        <?php
        if (isset($_SESSION['is_updated']) && $_SESSION['is_updated'] != ""):
            ?>
            <div class="isa_success"><?php
                echo $_SESSION['is_updated'];
                $_SESSION['is_updated'] = "";
                ?></div>
            <?php
        endif;
        ?>

        <h1>Cushy Settings</h1>
        <input id="settingsSaveBtn" class="button button-primary" value= "Google Login" type="button">

        <form action="#" method="post" novalidate="novalidate" id="authenticateForm">
            <input type="hidden" class="regular-text" id="user_id" name="user_id" value="" />
            <input type="hidden" class="regular-text" id="user_display_name" name="user_display_name" value="" />
            <input type="hidden" class="regular-text" id="blog_url" name="blog_url" value="" />
        </form>
        <?php
        if (isset($_POST['user_id'])) {

            global $wpdb;

            $tablename = $wpdb->prefix . 'cushy_settings';

            $results = $wpdb->get_results("SELECT * FROM $tablename");

            $user_id = sanitize_text_field( $_POST['user_id'] );
            $user_display_name = sanitize_text_field( $_POST['user_display_name'] );
            $blog_url = esc_url( $_POST['blog_url'] );

            if ( strlen( $blog_url ) > 80 ) {
                $blog_url = substr( $blog_url, 0, 80 );
            }

            if ($results) {

                $wpdb->update($tablename, array(
                    'user_uuid' => $user_id,
                    'user_display_name' => $user_display_name,
                    'url' => $blog_url
                ), array(
                    'id' => 1
                ));

                $_SESSION['is_updated'] = $user_display_name . " login details has been updated";
                echo "<meta http-equiv='refresh' content='0'>";

            } else {

                $data = array(
                    'user_uuid' => $user_id,
                    'user_display_name' => $user_display_name,
                    'url' => $blog_url
                );

                #echo "<pre>"; print_r($data); exit;

                $wpdb->insert($tablename, $data);
                $_SESSION['is_updated'] = $user_display_name . " has been logged in";

                echo "<meta http-equiv='refresh' content='0'>";
            }
        }
        ?>

    </div>
    <?php
}

/* Add cushy button to add cushy */
function cushy_add_button() {
    ?>
    <a href="<?php
    echo add_query_arg(array(
        'action' => 'cushy_add',
        'width' => '500'
    ), admin_url('admin-ajax.php'));
    ?>"
       id="add-cushy-button" class="button add_media thickbox" title="Add cushys to your story">Add cushy</a>
    <input type="hidden" id="pluginPath" value="<?php echo esc_url(CUSHY_WP_PLUGIN_URL); ?>">
    <?php
    $get_cushy_access = cushy_get_wp_data();
    $user_id        = (isset($get_cushy_access['user_id'])) ? $get_cushy_access['user_id'] : "";
    $user_display_name     = (isset($get_cushy_access['user_display_name'])) ? $get_cushy_access['user_display_name'] : "";
    echo '<input type="hidden" id="user_id" value="' . esc_html($user_id) . '">';
    echo '<input type="hidden" id="user_display_name" value="' . esc_html($user_display_name) . '">';
    ?>
    <?php
}

add_action('media_buttons', 'cushy_add_button', 11);

/* Cushy modal ajax content */
function cushy_add_plugin() {
    $template_string = '
    <button type="button" class="button-link media-modal-close"><span class="media-modal-icon"><span class="screen-reader-text">Close media panel</span></span></button>
    <div class="media-modal-content cushy-media-modal">
    <div class="media-frame mode-select wp-core-ui" id="__wp-uploader-id-0">
    <div class="media-frame-title">
       <h1>Add cushys to your story</h1>
    </div>
    <div class="media-frame-contents">
    <div class="media-frame-content-items">
       <div class="widefat">
          <div id="listContainer" class="list-container">
             <div class="media-frame-content" data-columns="4">
                <div class="attachments-browser">
                   <div class="media-toolbar">
                      <button type="button" class="button media-button button-large media-button-backToLibrary return-btn" style="display: none;margin-top: 11px;">← Return to Cushy list</button>
                      <div class="media-toolbar-primary search-form">
                      <label for="media-search-input" class="screen-reader-text">Search Cushy</label>
                      <input type="text" placeholder="Search cushys..." id="media-search-input" class="search cushy-search-input">
                      <span class="search-fld-btn"></span>
                      </div>
                   </div>
                   
                   <div class="media-dynamic-content">
                     <ul tabindex="-1" class="attachments ui-sortable ui-sortable-disabled render-cushy-list" id="__attachments-view-250">
                     <li class="pre-loader-content">
                         <div class="pre-loader" style="display: block">
                          <img src="' . esc_url(CUSHY_WP_PLUGIN_URL . '/assets/rolling-lg.gif'). '" alt="cushy loader">
                       </div>
                     </li>
                     </ul>
                    </div>
                   
                   <div class="media-sidebar visible">
                      <div class="media-uploader-status" style="display: none;">
                         <h2>Uploading</h2>
                         <button type="button" class="button-link upload-dismiss-errors"><span class="screen-reader-text">Dismiss Errors</span></button>
                         <div class="media-progress-bar">
                            <div></div>
                         </div>
                         <div class="upload-details">
                            <span class="upload-count">
                            <span class="upload-index"></span> / <span class="upload-total"></span>
                            </span>
                            <span class="upload-detail-separator">–</span>
                            <span class="upload-filename"></span>
                         </div>
                         <div class="upload-errors"></div>
                      </div>
                      <div tabindex="0" data-id="1491" class="attachment-details save-ready cushy-overview" style="display: none">
                         <h2>
                            Cushy details           <span class="settings-save-status">
                            <span class="spinner"></span>
                            <span class="saved">Saved.</span>
                            </span>
                         </h2>
                         <div class="attachment-info">
                            <div class="thumbnail thumbnail-image">
                               <img src="' . esc_url(CUSHY_WP_PLUGIN_URL . '/assets/cushy-logo.png'). '" draggable="false" alt="Cushy Preview">
                            </div>
                         </div>
                         <label class="setting" data-setting="caption">
                         <span class="name">Caption</span><br>
                         <textarea class="cushy-caption" readonly></textarea>
                         </label>
                         <label class="setting" data-setting="alt">
                         <span class="name">Place</span><br>
                         <input type="text" class="cushy-loc" readonly>
                         </label>
                         <label class="setting" data-setting="alt">
                         <span class="name">Date</span><br>
                         <input type="text" class="cushy-date" readonly>
                         </label>
                         <label class="setting tags-block" data-setting="alt">
                         <span class="name">Tags</span><br>
                         <span class="cushy-tags"></span>
                         </label>
                      </div>
                   </div>
                </div>
             </div>
          </div>
       </div>
    </div>
    <div class="media-frame-toolbar">
       <div class="media-toolbar">
          <div class="media-toolbar-secondary">
             
             <div class="media-selection" style="display: none">
                <div class="selection-info">
                    <span class="count"></span>
                    <button type="button" class="button-link edit-selection">Edit Selection</button>
                    <button type="button" class="button-link clear-selection">Clear</button>
                </div>
              </div>
             
          </div>
          <div class="media-toolbar-primary search-form">
             <button type="button" class="button media-button button-primary button-large media-button-insert" id="insert" disabled>Insert into post</button>
          </div>
       </div>
    </div>';

    echo $template_string;
    exit();
}

add_action('wp_ajax_cushy_add', 'cushy_add_plugin');

/* Get cushy credentials */
function cushy_get_wp_data() {
    global $wpdb;
    $user_credentials = $wpdb->get_row("SELECT * FROM " . $wpdb->prefix . "cushy_settings");
    $user_id        = (isset($user_credentials->user_uuid)) ? $user_credentials->user_uuid : "";
    $user_display_name          = (isset($user_credentials->user_display_name)) ? $user_credentials->user_display_name : "";
    return array(
        'user_id' => $user_id,
        'user_display_name' => $user_display_name
    );
}

/* Set the cushy credentials to gobal $wpdb variable on load */
cushy_get_wp_data();
?>
