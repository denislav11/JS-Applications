function appStart() {

    const app = Sammy('#container', function () {

        this.use('Handlebars', 'hbs');

        //Notifications
        $(document).on({
            ajaxStart: function () {
                $("#loadingBox").show();
            },
            ajaxStop: function () {
                $("#loadingBox").hide();
            }
        });

        (() => {
            $('#errorBox').click(hideNotification);
            $('#infoBox').click(hideNotification);
            function hideNotification(e) {
                $(this).hide();
            }
        })();

        this.get('#/home', displayHome);
        this.get('index.html', displayHome);

        this.post('#/register', function (context) {
            let username = context.params.username;
            let password = context.params.password;
            let repeatPassword = context.params.repeatPass;

            /*
             let englishAlphabetRegex = /^[A-Za-z]+$/g;

             if (username.length < 3) {
             auth.showError("Username must be at least 3 symbols!");
             return;
             }
             if (!englishAlphabetRegex.test(username)) {
             auth.showError("Username must contain only english alphabet letters!");
             return;
             }
             if (password.length < 6) {
             auth.showError("Password must be at least 6 symbols!");
             return;
             }
             if (password !== repeatPassword) {
             auth.showError("Passwords don't match!");
             return;
             }
             */

            auth.register(username, password, repeatPassword)
                .then(function (userInfo) {
                    auth.saveSession(userInfo);
                    auth.showInfo('User registration successful.');
                    displayHome(context);
                }).catch(auth.handleError);
        });

        this.post('#/login', function (context) {
            let username = context.params.username;
            let password = context.params.password;

            auth.login(username, password)
                .then(function (userInfo) {
                    auth.showInfo('Login successful.');
                    auth.saveSession(userInfo);
                    displayHome(context)
                }).catch(auth.handleError)
        });

        this.get('#/logout', function (context) {
            auth.logout()
                .then(function () {
                    sessionStorage.clear();
                    auth.showInfo('Logout successful.');
                    displayHome(context);
                }).catch(auth.handleError);
        });

        this.get('#/catalog', displayCatalog);

        //Posts
        //Details
        this.get('#/posts/details/:id', displayPost);

        //Edit post
        this.get('#/posts/edit/:id', function (context) {
            let postId = context.params['id'];
            postsService.getDetailsPost(postId)
                .then(function (postData) {
                    context.url = postData.url;
                    context.id = postData._id;
                    context.imageUrl = postData.imageUrl;
                    context.title = postData.title;
                    context.description = postData.description;
                    context.isAuthenticated = isAuthenticated();
                    context.username = sessionStorage.getItem('username');
                    context.loadPartials({
                        header: './templates/common/header.hbs',
                        footer: './templates/common/footer.hbs',
                        menu: './templates/navigation/menu.hbs'
                    }).then(function (content) {
                        this.partial('./templates/posts/editPost.hbs')
                    });
                })
                .catch(auth.handleError)
        });

        this.post('#/posts/edit/:id', function (context) {
            let postId = context.params['id'];
            let author = sessionStorage.getItem('username');
            let post = {
                imageUrl: context.params.image,
                url: context.params.url,
                title: context.params.title,
                author: author,
                description: context.params.description
            };
            postsService.editPost(postId, post)
                .then(function (post) {
                    auth.showInfo(`Post ${post.title} updated`);
                    displayCatalog(context);
                })
                .catch(auth.handleError)
        });

        //Delete post
        this.get('#/posts/delete/:id', function (context) {
            let postId = context.params['id'];
            postsService.deletePost(postId)
                .then(function () {
                    auth.showInfo('Post deleted.');
                    displayCatalog(context);
                }).catch(auth.handleError)
        });

        //Create Post
        this.get('#/createPost', function (context) {
            context.isAuthenticated = isAuthenticated();
            context.username = sessionStorage.getItem('username');

            context.loadPartials({
                header: './templates/common/header.hbs',
                footer: './templates/common/footer.hbs',
                menu: './templates/navigation/menu.hbs',
            }).then(function () {
                this.partial('./templates/posts/createPost.hbs');
            })
        });

        this.post('#/createPost', function (context) {
            let author = sessionStorage.getItem('username');
            let url = context.params.url;
            let title = context.params.title;
            let imageUrl = context.params.image;
            let description = context.params.description;

            postsService.createPost(url, title, imageUrl, description, author)
                .then(function (post) {
                    auth.showInfo('Post created.');
                    displayCatalog(context);
                }).catch(auth.handleError);
        });

        //My posts
        this.get('#/myPosts', function (context) {
            postsService.getMyPosts()
                .then(function (postsData) {
                    context.posts = convertPosts(postsData);
                    context.isAuthenticated = isAuthenticated();
                    context.username = sessionStorage.getItem('username');

                    context.loadPartials({
                        header: './templates/common/header.hbs',
                        footer: './templates/common/footer.hbs',
                        post: './templates/catalog/catalogPost.hbs',
                        menu: './templates/navigation/menu.hbs'
                    }).then(function () {
                        this.partial('./templates/catalog/catalogPage.hbs');
                    })
                })


        });


        //Comments
        this.get('#/deleteComment/:commentId', function (context) {
            let commentId = context.params['commentId'];
            commentService.deleteComment(commentId)
                .then(function (deletedComment) {
                    auth.showInfo('Comment delete.');
                    displayCatalog(context)
                }).catch(auth.handleError)
        });

        this.post('#/createComment/:postId', function (context) {
            let content = context.params.content;
            let author = sessionStorage.getItem('username');
            let postId = context.params['postId'];
            let comment = {
                author, content, postId
            };
            commentService.createComment(comment)
                .then(function (comment) {
                    context.params.id = postId;
                    auth.showInfo('Comment created.');
                    displayPost(context);
                })
                .catch(auth.handleError);
        });


        function displayHome(context) {
            context.isAuthenticated = isAuthenticated();
            context.username = sessionStorage.getItem('username');
            context.loadPartials({
                header: './templates/common/header.hbs',
                footer: './templates/common/footer.hbs',
                menu: './templates/navigation/menu.hbs',
                about: './templates/home/about.hbs',
                homeForms: './templates/home/homeForms.hbs'
            }).then(function (content) {
                this.partial('./templates/home/home.hbs')
            });
        }

        function displayPost(context) {
            let postId = context.params['id'];
            postsService.getDetailsPost(postId)
                .then(function (postData) {
                    commentService.getCommentsByPost(postId)
                        .then(function (commentsData) {
                            let comments = [];
                            for (let comment of commentsData) {
                                let date = calcTime(comment._kmd.ect);
                                comments.push({
                                    content: comment.content,
                                    date: date,
                                    author: comment.author,
                                    commentId: comment._id,
                                    isCommentAuthor: sessionStorage.getItem('userId') === comment._acl.creator
                                });
                            }

                            let postDate = calcTime(postData._kmd.ect);
                            let isAuthor = sessionStorage.getItem('userId') === postData._acl.creator;
                            let post = [{
                                url: postData.url,
                                imageUrl: postData.imageUrl,
                                title: postData.title,
                                description: postData.description,
                                date: postDate,
                                isAuthor: isAuthor,
                                postId: postData._id
                            }];

                            context.posts = post;
                            context.comments = comments;
                            context.postId = postId;

                            context.isAuthenticated = isAuthenticated();
                            context.username = sessionStorage.getItem('username');
                            context.loadPartials({
                                header: './templates/common/header.hbs',
                                footer: './templates/common/footer.hbs',
                                menu: './templates/navigation/menu.hbs',
                                post: './templates/posts/postDetails.hbs',
                                comment: './templates/posts/comment.hbs'
                            }).then(function () {
                                this.partial('./templates/posts/viewComments.hbs')
                            })
                        }).catch(auth.handleError)
                }).catch(auth.handleError)
        }

        function displayCatalog(context) {
            postsService.getAllPosts()
                .then(function (postsData) {
                    context.posts = convertPosts(postsData);
                    context.isAuthenticated = isAuthenticated();
                    context.username = sessionStorage.getItem('username');


                    context.loadPartials({
                        header: './templates/common/header.hbs',
                        footer: './templates/common/footer.hbs',
                        post: './templates/catalog/catalogPost.hbs',
                        menu: './templates/navigation/menu.hbs'
                    }).then(function () {
                        this.partial('./templates/catalog/catalogPage.hbs');
                    })
                }).catch(auth.handleError)
        }

    });

    function isAuthenticated() {
        return sessionStorage.getItem('authtoken') !== null;
    }

    function calcTime(dateIsoFormat) {
        let diff = new Date - (new Date(dateIsoFormat));
        diff = Math.floor(diff / 60000);
        if (diff < 1) return 'less than a minute';
        if (diff < 60) return diff + ' minute' + pluralize(diff);
        diff = Math.floor(diff / 60);
        if (diff < 24) return diff + ' hour' + pluralize(diff);
        diff = Math.floor(diff / 24);
        if (diff < 30) return diff + ' day' + pluralize(diff);
        diff = Math.floor(diff / 30);
        if (diff < 12) return diff + ' month' + pluralize(diff);
        diff = Math.floor(diff / 12);
        return diff + ' year' + pluralize(diff);
        function pluralize(value) {
            if (value !== 1) return 's';
            else return '';
        }
    }

    function convertPosts(postData) {
        let posts = [];
        for (let post of postData) {
            let date = calcTime(post._kmd.ect);
            posts.push({
                url: post.url,
                imageUrl: post.imageUrl,
                title: post.title,
                date: date,
                author: post.author,
                postId: post._id,
                isAuthor: sessionStorage.getItem('userId') === post._acl.creator
            })
        }
        return posts;
    }

    app.run();
}