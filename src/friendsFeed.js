// Only accepted friend accounts appear in Friends Feed; the main feed also includes you.
export function isAcceptedFriendsPost(post, connected, userId, acceptedFriendIds, demoHandle, demoFriendHandles) {
 if(!post)return false;
 if(connected)return Boolean(post.author_id && post.author_id!==userId && acceptedFriendIds?.has(post.author_id));
 return Boolean(post.author?.handle && post.author.handle!==demoHandle && demoFriendHandles?.includes(post.author.handle));
}
export function isNetworkPost(post, connected, userId, acceptedFriendIds, demoHandle, demoFriendHandles){
 if(!post)return false;
 const isMine=connected?Boolean(userId && post.author_id===userId):Boolean(demoHandle && post.author?.handle===demoHandle);
 return isMine||isAcceptedFriendsPost(post,connected,userId,acceptedFriendIds,demoHandle,demoFriendHandles);
}
