/*jshint esversion: 6 */
(function(){
    "use strict";
    
    window.addEventListener('load', function() {
        var imgPage = 0;
        var page = 0;

        api.onError(function(err){
            console.error("[error]", err);
        });
        
        api.onError(function(err){
            let error_box = document.querySelector('#error_box');
            error_box.innerHTML = err;
            error_box.style.visibility = "visible";
        });
        
        api.onUserUpdate(function(username){
            document.querySelector("#signin_button").style.visibility = (username)? 'hidden' : 'visible';
            document.querySelector("#signout_button").style.visibility = (username)? 'visible' : 'hidden';
            document.querySelector('.image_form_btn').style.display = (username)? 'flex' : 'none';
            document.querySelector('#gallery_selection').style.display = (username)? 'flex' : 'none';
        });

        api.onGalleryChange(function(usernames) {
            document.querySelector("#user_gallery_list").innerHTML = "";
            if (usernames.length > 0) {
                usernames.forEach(function(username){
                    let elmt = document.createElement('option');
                    elmt.value = username;
                    elmt.innerHTML= username;
                    document.querySelector("#user_gallery_list").prepend(elmt);
                });
            }
        });

        document.querySelector('#signin_button').addEventListener('click', function() {
            document.querySelector('#login_form').style.display = 'flex';
        });

        document.getElementById('signin').addEventListener('click', function(e) {
            e.preventDefault();
            let username = document.querySelector("#login_form [name=username]").value;
            let password = document.querySelector("#login_form [name=password]").value;
            document.getElementById("login_form").reset();
            document.getElementById("login_form").style.display = 'none';

            api.signin(username, password);
        });

        document.getElementById('signup').addEventListener('click', function(e) {
            e.preventDefault();
            let username = document.querySelector("#login_form [name=username]").value;
            let password = document.querySelector("#login_form [name=password]").value;
            document.getElementById("login_form").reset();
            document.getElementById("login_form").style.visibility = 'hidden';

            api.signup(username, password);
        });

        document.querySelector('#signout_button').addEventListener('click', function() {
            api.signout();
            document.getElementById("title").innerHTML = "The Web Gallery";
            document.getElementById("image_form").style.display = "none";
        });

        //check if gallery is empty
        api.onHideCheck(function(username, firstImage) {
            if (username) {
                if (firstImage.length > 0) {
                    //show related elements
                    document.getElementById("display_box").style.display = "block";
                    document.getElementById("comment_form").style.display = "flex";
                    document.querySelector(".comments").style.display = "flex";
                    document.querySelector(".comment_navigation").style.display = "flex";
                } else {
                    //hide related elements
                    document.getElementById("display_box").style.display = "none";
                    document.getElementById("comment_form").style.display = "none";
                    document.querySelector(".comments").style.display = "none";
                    document.querySelector(".comment_navigation").style.display = "none";
                }
            } else {
                //hide related elements
                document.getElementById("display_box").style.display = "none";
                document.getElementById("comment_form").style.display = "none";
                document.querySelector(".comments").style.display = "none";
                document.querySelector(".comment_navigation").style.display = "none";
            }
        });

        document.querySelector('.image_form_btn').addEventListener('click', function() {
            let form = document.getElementById("image_form");
            if (form.style.display === "flex") {
                form.style.display = "none";
            } else {
                form.style.display = "flex";
            }
        });

        api.onImageUpdate(function(image) {
            if (image) {
                let error_box = document.querySelector('#error_box');
                error_box.style.visibility = "hidden";

                let element = document.createElement('div');
                element.className = "image_display";
                element.id = "image " + image._id;
                element.innerHTML = `
                <div class="display_content">
                    <img class="display_img" src="/api/images/${image._id}/picture/">
                    <div class="display_detail">
                        <h4>Title:</h4>
                        <span id="display_title">${image.title}</span>
                    </div>
                    <div class="display_detail">
                        <h4>Author:</h4>
                        <span id="display_author">${image.author}</span>
                    </div>
                </div>
                <div class="display_btn">
                    <div class="navigation_container">
                        <div class="image-previous icon"></div>
                        <div class="image-next icon"></div>
                    </div>
                    <div class="delete_container">
                        <div class="image-delete icon"></div>
                    </div>
                </div>
                `;
                let display = document.querySelector('#display_box');
                display.removeChild(display.firstChild);
                display.append(element);

                element.querySelector('.image-previous').addEventListener('click', function(e) {
                    if (imgPage > 0) {
                        imgPage--;
                    }
                    api.changeImage(image.author, imgPage);
                });

                element.querySelector('.image-next').addEventListener('click', function(e) {
                    imgPage++;
                    api.changeImage(image.author, imgPage);
                });

                element.querySelector('.image-delete').addEventListener('click', function(e) {
                    api.deleteImage(image._id);
                });
                page = 0;
            }
        });

        api.onCommentUpdate(function(comments) {
            document.querySelector('.comments').innerHTML = '';
            comments.forEach(function(comment) {
                let element = document.createElement('div');
                element.className = "comment";
                element.id = "comment " + comment._id;
                element.innerHTML = `
                <div class="comment_head">
                    <div class="comment_author">${comment.author}</div>
                    <div class="comment_date">${comment.createdAt}</div>
                </div>
                <div class="comment_body">
                    <div class="comment_content">${comment.content}</div>
                    <div class="comment-delete icon"></div>
                </div>
                `;

                element.querySelector('.comment-delete').addEventListener('click', function(e) {
                    let imageId = document.querySelector('.image_display').id.split(" ")[1];
                    api.deleteComment(imageId, comment._id);
                    document.querySelector('.page_Num').innerHTML = 0;
                });

                document.querySelector('.comments').prepend(element);
            });
            document.querySelector('.page_Num').innerHTML = page;
        });

        document.querySelector('.comment-previous').addEventListener('click', function(e) {
            let imageId = document.querySelector('.image_display').id.split(" ")[1];
            if (page > 0) {
                page--;
            }
            api.changePage(imageId, page);
        });

        document.querySelector('.comment-next').addEventListener('click', function(e) {
            let imageId = document.querySelector('.image_display').id.split(" ")[1];
            page++;
            api.changePage(imageId, page);
        });

        document.getElementById('image_form').addEventListener('submit', function(e) {
            e.preventDefault();
            let title = document.getElementById("image_title").value;
            let picture = document.getElementById("image_file").files[0];
            document.getElementById("image_form").reset();
            api.addImage(title, picture);
            if (imgPage != 0) {
                imgPage += 1;
            }
        });

        document.getElementById('comment_form').addEventListener('submit', function(e) {
            e.preventDefault();
            let comment = document.getElementById("comment_content").value;
            document.getElementById("comment_form").reset();
            let imageId = document.querySelector('.image_display').id.split(" ")[1];
            api.addComment(imageId, comment);
            document.querySelector('.page_Num').innerHTML = 0;
        });

        document.getElementById('gallery_selection').addEventListener('submit', function(e) {
            e.preventDefault();
            let username = document.getElementById("user_gallery_list").value;
            api.changeImage(username, 0);
            document.getElementById("title").innerHTML = username + "'s Web Gallery";
            imgPage = 0;
        });
    });
    
}());