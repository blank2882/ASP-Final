// Used for group page
// Functions for voting on suggestions
function vote(suggestionId, type) {
  // initliaze the button and count elements
  let likeBtn = document.getElementById(`like-${suggestionId}`);
  let dislikeBtn = document.getElementById(`dislike-${suggestionId}`);
  let likeCount = document.getElementById(`like-count-${suggestionId}`);
  let dislikeCount = document.getElementById(`dislike-count-${suggestionId}`);
  let liked = likeBtn.classList.contains("btn-success");
  let disliked = dislikeBtn.classList.contains("btn-danger");

  // update the vote count and button color
  if (type === "like") {
    if (liked) {
      likeBtn.classList.remove("btn-success");
      likeCount.textContent = parseInt(likeCount.textContent) - 1;
    } else {
      likeBtn.classList.add("btn-success");
      likeCount.textContent = parseInt(likeCount.textContent) + 1;
      if (disliked) {
        dislikeBtn.classList.remove("btn-danger");
        dislikeCount.textContent = parseInt(dislikeCount.textContent) - 1;
      }
    }
  } else if (type === "dislike") {
    if (disliked) {
      dislikeBtn.classList.remove("btn-danger");
      dislikeCount.textContent = parseInt(dislikeCount.textContent) - 1;
    } else {
      dislikeBtn.classList.add("btn-danger");
      dislikeCount.textContent = parseInt(dislikeCount.textContent) + 1;
      if (liked) {
        likeBtn.classList.remove("btn-success");
        likeCount.textContent = parseInt(likeCount.textContent) - 1;
      }
    }
  }
}
