# Blog Module Manual Tests

## Reader Flow
- Visit the app and open the Blog section.
- Verify published posts load with title and excerpt.
- Open a post and confirm full content is shown.
- Verify approved comments render under the post.

## Organizer Flow
- Create a new draft from the Blog manager.
- Edit the draft and save changes.
- Submit the draft for review and confirm status updates to `PENDING_REVIEW`.

## Admin Flow
- Open the pending review list and publish a post.
- Verify the post appears in the public Blog list.
- Archive a post and confirm it disappears from public list.
- Approve and reject pending comments and verify status updates.

## Comment Flow
- Log in as any user and post a comment.
- Verify comment is visible only after admin approval.
