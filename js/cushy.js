jQuery(function($) {
    var isDebug = false;
    var endpoint = (isDebug) ? '192.168.0.106:4200' : 'cushy.com/';
    var apiBaseUrl = 'http://' + endpoint;
    var $this = $(document);
    var pluginUrl = $this.find('input#pluginPath').val();
    var trackPage = 1;
    var loading = false;
    var selectedItems = [];
    var isResized = false;
    var user_domain = window.location.href;
    var userId = '';

    $(document).find(".cushy-preview").remove();

    $this.addClass('cushy-media-modal media-modal');
    $this.find('a#add-cushy-button').html('<img src="' + pluginUrl + '/assets/cushy-logo.png" alt="add cushy" style="width:18px; margin-top: -4px;" />Add cushy');

    $.fn.calculateAspectRatioFit = function (srcWidth, srcHeight, maxWidth, maxHeight) {
        var ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
        return {
            width: srcWidth * ratio,
            height: srcHeight * ratio
        };
    };

    // Initialize Firebase
    var config = {
        apiKey: "AIzaSyANllP6j2E8zZYw6IwSkJaNNulxINwgd3M",
        authDomain: "cushyapp-c3f41.firebaseapp.com",
        databaseURL: "https://cushyapp-c3f41.firebaseio.com",
        projectId: "cushyapp-c3f41",
        storageBucket: "cushyapp-c3f41.appspot.com",
        messagingSenderId: "265282831478"
    };
    firebase.initializeApp(config);

    var provider = new firebase.auth.GoogleAuthProvider();

    provider.addScope('https://www.googleapis.com/auth/contacts.readonly');

    $this.on('click', '#settingsSaveBtn', function () {
        firebase.auth().signInWithPopup(provider).then(function(result) {
            // This gives you a Google Access Token. You can use it to access the Google API.
            var token = result.credential.accessToken;
            // The signed-in user info.
            var user = result.user;
            var userEmail = user.email;
            var userName = user.displayName;
            var userDP = user.photoURL;
            var userRefreshToken = user.refreshToken;
            var userToken = user.userToken

            $.ajax({
                type: 'POST',
                url: "https://user.cushy.com/v1/data/blog_plugin_login",
                headers: {
                    'cushy_api_key': '3bcd1fb0eaeabe09e96ae043e3f209a7',
                    'auth_secret':   '11fc2ab1fe734795d0d2f25dfd93bc81'
                },
                data: {
                    'email_id': userEmail,
                },
                cache: 'false',
                dataType: 'json',
                success: function (response) {
                    if (response.result !== undefined && response.result == 'SUCCESS') {
                            user_id = response.user_id,
                            user_display_name = userName,
                            blog_url = window.location.href;

                        $("input#user_id").val( user_id );
                        $("input#user_display_name").val( user_display_name );
                        $("input#blog_url").val( blog_url );

                        $('form#authenticateForm').submit();
                    }
                    else {
                        console.log(response.message);

                    }
                },

            });
        })

    });

    $.fn.has_scrollbar = function () {
        var divnode = this.get(0);
        if (divnode.scrollHeight > divnode.clientHeight)
            return true;
    }

    /**
     * Fetch the user posted cushy list
     *
     */

    $.fn.fetchCushyList = function (trackPage, isSearchCleared) {
        setTimeout(function () {
            if (loading == false) {
                loading = true; //set loading flag on
                var userId = $.trim($(document).find("#user_id").val());
                var searchKey = $.trim($(document).find('#media-search-input').val());

                $('#TB_window').addClass('cushyTBWindow');
                if (userId !== "") {
                    $.ajax({
                        method: "GET",
                        url: "https://user.cushy.com/v1/data/get_filtered_cushy_by_user",
                        headers: {
                                    'cushy_api_key': '3bcd1fb0eaeabe09e96ae043e3f209a7',
                                    'auth_secret':   '11fc2ab1fe734795d0d2f25dfd93bc81'
                                  },
                        data: {
                            user_id :userId,
                            count: 20,
                            page: trackPage,
                            key: searchKey
                         },
                        beforeSend: function () {
                            if (searchKey.length > 0 || isSearchCleared !== undefined)
                                $.fn.searchFieldActions(true);
                            else
                                $('.pre-loader').show();
                        },
                        dataType: "json",
                        success: function (response) {
                            $.fn.searchFieldActions(false);
                            loading = false; //set loading flag off once the content is loading
                            $('.pre-loader').hide();
                            $('button#loadMoreBtn').text('Load more');
                            if (response.result ==  "SUCCESS" && response.records !== undefined && response.records.length > 0) {

                                var liContent = "";
                                if (searchKey.length > 0 || isSearchCleared !== undefined) {
                                    $('#TB_window').find('.render-cushy-list').find('li').not('li.pre-loader-content').remove();
                                }

                                var lgImgUrl = thumbUrl = '';
                                $.each(response.records, function (index, value) {
                                    lgImgUrl = (value.media_url_medium  !== undefined) ? value.media_url_medium : "";
                                    thumbUrl = (value.media_url_small !== undefined) ? value.media_url_small : "";
                                    var theDate = new Date(value.cushy_captured_time * 1000);
                                    dateString = theDate.toGMTString();



                                    liContent = '<li tabindex="0" role="checkbox" aria-label="' + index + '" data-id="' + value.cushy_id + '" class="attachment save-ready select-item is-def-ite">' +
                                        '<div class="attachment-preview js--select-attachment type-image subtype-png landscape">' +
                                        '<div class="thumbnail cushy-lazy-bg" rel="' + value.cushy_id + '">' +
                                        '<div class="centered">' +
                                        '<img class="thumb-img" src="' + thumbUrl + '" draggable="false" alt="N/A">' +
                                        '</div>' +
                                        '</div>' +
                                        '</div>' +
                                        '<button type="button" class="button-link check" tabindex="0"><span class="media-modal-icon"></span><span class="screen-reader-text">Deselect</span></button>' +
                                        '<input type="hidden" id="cushy_id' + value.cushy_id + '" name="cushy_id[]" value="' + value.cushy_id + '">' +
                                        '<input type="hidden" id="cushy_view_url' + value.cushy_id + '" name="cushy_view_url[]" value="' + value.view_url + '">' +
                                        '<input type="hidden" id="cushy_media' + value.cushy_id + '" name="cushy_media[]" value="' + lgImgUrl + '">' +
                                        '<input type="hidden" id="cushy_desc' + value.cushy_id + '" name="cushy_desc[]" value="' + value.description + '">' +
                                        '<input type="hidden" id="cushy_loc' + value.cushy_id + '" name="cushy_loc[]" value="' + value.location + '">' +
                                        '<input type="hidden" id="cushy_date' + value.cushy_id + '" name="cushy_date[]" value="' + dateString + '">' +
                                        '<input type="hidden" id="cushy_tags' + value.cushy_id + '" name="cushy_tags[]" value="' + value.tags_csv + '">' +
                                        '<input type="hidden" id="cushy_img_data' + value.cushy_id + '" name="cushy_img_data[]" value="' + value.media_original_width +  'x' + value.media_original_height + '">'
                                    '</li>';

                                    $this.find('#TB_window').find('.render-cushy-list').append(liContent);
                                });

                                $this.find('#TB_window').find('.render-cushy-list').find("img.thumb-img").load(function () {
                                    this.style.opacity = 1;
                                });

                                if (response.next !== undefined && response.next > 0 && response.records.length >= 20) {
                                    var insertLoddBtn = '<li class="btn-load-wrap"><button type="button" id="loadMoreBtn" class="btn btn-md btn-core-btn">Load more</button></li>';
                                    $('#TB_window').find('.render-cushy-list').append(insertLoddBtn);
                                }
                            } else {
                                if (response.message !== undefined && response.message !== "") {
                                    $('#TB_window').find('.render-cushy-list').html('<li class="error-holder">' + response.message + '</li>');
                                } else {
                                    if (response.data.records != undefined && response.data.records.length == 0)
                                        $('#TB_window').find('.render-cushy-list').html('<li class="error-holder">No matching cushys</li>');
                                }
                                $this.find('.clear-selection').trigger('click');
                            }
                        },
                        error: function () {
                          //  console.log("Error fetching data");
                        }
                    });
                } else {
                    $('.pre-loader').hide();
                    $('#TB_window').find('.render-cushy-list').html('<li class="error-holder">Cushy credentials are missing</li>');
                    console.log('Cushy credentials are missing');
                }
            }
        }, 500);
    }

    // fetch cushy list on add cushy button trigger
    $('#add-cushy-button').on('click', function () {
        if( userId == ''){
            loading = false;
           // console.log('Cushy credentials are missing');
        }
        trackPage = 1;
        selectedItems = [];
        cushyShortCode = "";
        $.fn.fetchCushyList(trackPage);

    })

    var isSearched = false;
    $this.on('keyup click', '.cushy-search-input', function (event) {
        var strLen = $.trim($(this).val());
        clearTimeout($.data(this, 'timer'));
        trackPage = 1;

        if (event.type == 'keyup' && (strLen.length > 2 || strLen.length === 0)) {
            isSearched = true;
            $(this).data('timer', setTimeout(function () {
                $.fn.fetchCushyList(trackPage, isSearched);
            }, 200));
        }

        if (event.type == 'click' && strLen.length > 0 && isSearched) {
            isSearched = false;
            $(this).data('timer', setTimeout(function () {
                $.fn.fetchCushyList(trackPage, isSearched);
            }, 200));
        }
    })

    $this.on('click', '.search-close-icon', function (event) {
        //$.fn.searchFieldActions(true);
        $this.find('.cushy-search-input').val('');
        trackPage = 1;
        $.fn.fetchCushyList(trackPage, false);
    })

    $.fn.searchFieldActions = function (showLoader) {
        if (showLoader) {
            $this.find('.search-fld-btn').addClass('search-load-icon').removeClass('search-close-icon');
        }
        else {
            if ($this.find('.cushy-search-input').val().length > 0) {
                $this.find('.search-fld-btn').addClass('search-close-icon').removeClass('search-load-icon');
            } else
                $this.find('.search-fld-btn').removeClass('search-load-icon search-close-icon');
        }
    }

    $this.on('click', 'button#loadMoreBtn', function (e) {
        $(this).attr('disabled', true).text('Loading...');
        trackPage++;
        $('.btn-load-wrap').fadeOut();
        $.fn.fetchCushyList(trackPage);
    })

    var isKeyPressed = false;
    var cushyShortCode = "";
    $this.on('click', 'li.select-item', function (e) {
        isKeyPressed = (e.ctrlKey || e.metaKey) ? true : false;
        var cushyId = $(this).attr('data-id');
        var isFound = $.inArray(cushyId, selectedItems);
        if (isFound >= 0) {
            selectedItems.splice(isFound, 1);
        } else {
            if (selectedItems.length === 5) {
                alert("You can select upto 5 Cushy's");
            } else {
                selectedItems.push(cushyId);
            }
        }

        $this.find('li.select-item').removeClass('selected details');
        if (selectedItems.length > 0) {
            $.each(selectedItems, function (index, value) {
                $("[data-id='" + value + "']").addClass('selected');
            })
        }

        $(this).addClass('details');
        var numItemsSelected = selectedItems.length;

        if (numItemsSelected > 0) {
            var cushyMedia = $(this).find('.thumbnail').attr('src');
            var cushyMedia = $("#cushy_media" + cushyId).val();
            var cushyDesc = $("#cushy_desc" + cushyId).val();
            var cushyLoc = $("#cushy_loc" + cushyId).val();
            var cushyDate = $("#cushy_date" + cushyId).val();

            $this.find('.cushy-overview').show();
            $this.find('.attachment-info .thumbnail-image img').attr('src', cushyMedia);
            $('input.cushy-media').val(cushyMedia);
            $('textarea.cushy-caption').val(cushyDesc.replace(/\\/g, ''));
            $('input.cushy-loc').val(cushyLoc.replace(/\\/g, ''));
            $('input.cushy-date').val(cushyDate);

            var buggleTagsList = $("#cushy_tags" + cushyId).val();
            if (buggleTagsList !== "") {
                $('.tags-block').css('display', 'block').find('.cushy-tags').html(buggleTagsList);
            }
            else $('.tags-block').css('display', 'none').find('.cushy-tags').html('');

            if (!$this.find('.return-btn').is(':visible')) {
                $('.media-selection').show();
            }

            $('.media-selection').find('.count').text(numItemsSelected + ' selected');
            $this.find('.media-button-insert').attr('disabled', false);
        } else {
            $('.media-selection').hide();
            $this.find('.media-button-insert').attr('disabled', true);
        }
    })

    $this.on('click', '.edit-selection', function () {
        $this.find('.select-item').not('.selected').hide();
        $this.find('.media-selection, button#loadMoreBtn').hide();
        $this.find('.return-btn').show();
    })

    $this.on('click', '.clear-selection', function () {
        selectedItems = [];
        $this.find('.select-item').removeClass('selected details');
        $this.find('.media-button-insert').attr('disabled', true);
        $('.media-selection, .cushy-overview').hide();
    })

    $this.on('click', '.return-btn', function () {
        $(this).hide();
        $this.find('.select-item, .media-selection, button#loadMoreBtn').show();
    })

    $(document).on('click', '.thumbnail', function () {
        $('body').removeClass('active-cushy');
        $(this).addClass('active-cushy');
    })

    $.fn.removeIframeMargin = function () {
        setTimeout(function () {
            var $head = $("#content_ifr").contents().find("head");
            $head.append($("<link/>",
                {rel: "stylesheet", href: pluginUrl + '/css/cushy-override.css', type: "text/css"}
            ));
        }, 1);
    }

    var sh_tag = 'cushy_card';
    $(document).on('click', '.media-button-insert', function () {
        if (selectedItems.length > 0) {
            $(this).attr('disabled', false);
            $.each(selectedItems, function (index, value) {
                var imgWH = $("#cushy_img_data" + value).val();
                cushyShortCode += '<div class="cushy-card" style="display: none">[cushyview caption="' + $("#cushy_desc" + value).val() + '" id="' + value + '" img_data="' + imgWH + '"]\n</div>';
                var img_wh = imgWH.split("x");
                var ifWidth = 320;
                var ifHeight = 480;
                if (img_wh !== undefined && img_wh[0] !== undefined) {
                    if (img_wh[0] > img_wh[1]) {
                        ifWidth = 480;
                        ifHeight = 320;
                    }
                }

                var fetch_shortcode = '[cushy_card caption="' + $("#cushy_desc" + value).val() + '" id="' + value + '" img_data="' + imgWH + '"]';
                wp.media.editor.insert(fetch_shortcode);
            })

            selectedItems = [];
            $.fn.removeIframeMargin();

        } else {
            $(this).attr('disabled', true);
            return false;
        }
    })

    $(document).on('click', '.media-modal-close', function () {
        trackPage = 1;
        selectedItems = [];
        cushyShortCode = "";
        $this.find('.select-item').removeClass('selected details');
        $this.find('#TB_window').fadeOut();
        $this.find('#TB_overlay').css({
            'background': 'transparent',
            'opacity': 1
        });
    })

    if (typeof(tinyMCE) != "undefined") {
        if (tinyMCE.activeEditor == null || tinyMCE.activeEditor.isHidden() != false) {
            $.fn.tinyMcePluginParser = function () {
                tinymce.PluginManager.add('cushy_card', function (editor, url) {
                    var sh_tag = 'cushy_card';

                    //helper functions
                    function getCushyAttr(s, n) {
                        n = new RegExp(n + '=\"([^\"]+)\"', 'g').exec(s);
                        return n ? window.decodeURIComponent(n[1]) : '';
                    };

                    function cushyHtml(cls, data, con) {
                        var cushyCode = getCushyAttr(data, 'id');
                        var imgWH = getCushyAttr(data, 'img_data');
                        var img_wh = imgWH.split("x");
                        var iFrameWidth = 0;
                        var iFrameHeight = 0;
                        var desc = getCushyAttr(data, 'caption');
                        var descLength = desc.length;
                        var descElementHeight = (desc !== "") ? 20 : 20;
                        var baseLineHeight = 60;
                        if(descLength > 60) {
                            descElementHeight = Math.round((descLength/baseLineHeight) * descElementHeight);
                        }

                        if (img_wh !== undefined && img_wh[0] !== undefined) {
                            imgWidth = img_wh[0];
                            imgHeight = img_wh[1];

                            var editorContentWidth = ( $(window).width() < 1440 ) ? $(document).find('.mce-edit-area').innerWidth() * 75 / 100 : $(document).find('.mce-edit-area').innerWidth();
                            iFrameHeight = (imgHeight / imgWidth * editorContentWidth);
                            iFrameHeight = iFrameHeight + descElementHeight + 140;
                            iFrameHeight = Math.round(iFrameHeight);

                            if (editorContentWidth > imgWidth) {
                                iFrameWidth = imgWidth;
                                iFrameHeight = imgHeight;
                            }
                            else {
                                iFrameWidth = editorContentWidth;
                            }
                            data = window.encodeURIComponent(data);
                            content = window.encodeURIComponent(con);

                            $(document).find('.mce-preview-object').css('display', 'none');
                            $(document).find('.aboutCushy').css('display', 'none');

                            return '<iframe scrolling="no" seamless="seamless" src="' + apiBaseUrl + '/o/blog/' + cushyCode + '" width="' + iFrameWidth + '" height="' + iFrameHeight + '" class="mceItem ' + cls + '" data-sh-attr="' + data + '" data-sh-content="' + con + '" frameborder="0" style="border: solid 1px #e1e1e1;width: ' + iFrameWidth + 'px; height: ' + iFrameHeight + 'px; max-width: ' + iFrameWidth + 'px; max-height: ' + iFrameHeight + 'px;overflow: hidden!important; background: #D8D8D8 url(' + pluginUrl + '/assets/loader.png) no-repeat center center;"></iframe>';
                        }
                    }

                    function replaceCushyShortcodes(content) {
                        return content.replace(/\[cushy_card([^\]]*)\]/g, function (all, attr, con) {
                            return cushyHtml('wp-' + sh_tag, attr, con);
                        });
                    }

                    function restoreCushyShortcodes(content) {
                        return content.replace(/(<iframe.*?>.*?<\/iframe>)/g, function (match, image) {
                            var data = getCushyAttr(image, 'data-sh-attr');
                            var con = getCushyAttr(image, 'data-sh-content');

                            if (data) {
                                return '<p>[' + sh_tag + data + ']</p>';
                            }

                            return match;
                        });
                    }

                    editor.on('BeforeSetcontent', function (event) {
                        event.content = replaceCushyShortcodes(event.content);
                    });

                    editor.on('GetContent', function (event) {
                        event.content = restoreCushyShortcodes(event.content);
                    });

                    $.fn.removeIframeMargin();
                });
            }

            $.fn.tinyMcePluginParser();
        }
    }
});