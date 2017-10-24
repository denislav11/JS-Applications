let postsService = (() => {

    //Posts
    function getAllPosts() {
        return requester.get('appdata', 'posts', 'kinvey');
    }

    function getDetailsPost(postId) {
        let endPoint = `posts/${postId}`;
        return requester.get('appdata', endPoint, 'kinvey');
    }

    function createPost(url, title, image, description, author) {
        let post = {url, title, imageUrl: image, description, author};
        return requester.post('appdata', 'posts', 'kinvey', post);
    }

    function editPost(postId, editedPost) {
        return requester.update('appdata', `posts/${postId}`, 'kinvey', editedPost)
    }

    function deletePost(postId) {
        return requester.remove('appdata', `posts/${postId}`, 'kinvey');
    }

    function getMyPosts() {
        let username = sessionStorage.getItem('username');
        return requester.get('appdata', `posts?query={"author":"${username}"}&sort={"_kmd.ect": -1}`)
    }

    return {
        getAllPosts,
        getDetailsPost,
        createPost,
        editPost,
        deletePost,
        getMyPosts
    }
})();