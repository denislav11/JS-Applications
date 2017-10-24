let commentService = (() => {

    function getCommentsByPost(postId) {
        let endPoint = `comments?query={"postId":"${postId}"}&sort={"_kmd.ect": -1}`;
        return requester.get('appdata', endPoint, 'kinvey');
    }

    function deleteComment(commentId) {
        let endPoint = `comments/${commentId}`;
        return requester.remove('appdata', endPoint, 'kinvey')
    }

    function createComment(comment) {
        return requester.post('appdata', 'comments', 'kinvet', comment);
    }

    return {
        getCommentsByPost,
        deleteComment,
        createComment
    }
})();