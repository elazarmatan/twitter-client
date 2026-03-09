import React from 'react';
import { Card, CardContent, Typography, Avatar, Box, Chip, IconButton, TextField, Button } from '@mui/material';
import { Favorite, FavoriteBorder, ChatBubbleOutline } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { getUser } from '../api';

interface Comment {
  username: string;
  description: string;
}

interface Post {
  id: number;
  username: string;
  description: string;
  likes: string[];
  comments: Comment[];
  image?: string;
  tags?: string[];
}

interface PostProps {
  post: Post;
  currentUser?: string;
  onLike?: () => void;
  onUnlike?: () => void;
  onComment?: (description: string) => void;
}

const PostComponent: React.FC<PostProps> = ({ post, currentUser, onLike, onUnlike, onComment }) => {
  const [showComments, setShowComments] = React.useState(false);
  const [newComment, setNewComment] = React.useState('');
  const likedByUser = currentUser ? post.likes.includes(currentUser) : false;

  const { data: postUser } = useQuery({
    queryKey: ['user', post.username],
    queryFn: () => getUser(post.username),
  });

  const handleLikeClick = () => {
    if (likedByUser) {
      onUnlike && onUnlike();
    } else {
      onLike && onLike();
    }
  };

  const submitComment = () => {
    if (newComment.trim() && onComment) {
      onComment(newComment.trim());
      setNewComment('');
    }
  };

  return (
    <Card sx={{ maxWidth: 600, margin: 'auto', mb: 2 }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={1}>
          <Avatar src={postUser?.image ? `http://localhost:3000${postUser.image}` : undefined} sx={{ mr: 2 }}>
            {post.username[0].toUpperCase()}
          </Avatar>
          <Typography variant="h6">{postUser?.name || post.username}</Typography>
        </Box>
        <Typography variant="body1" mb={1}>{post.description}</Typography>
        {post.image && (
          <Box mb={1}>
            <img src={post.image} alt="Post image" style={{ maxWidth: '100%', borderRadius: 8, maxHeight:'350px' }} />
          </Box>
        )}
        {post.tags && post.tags.length > 0 && (
          <Box mb={1}>
            {post.tags.map((tag, index) => (
              <Chip key={index} label={`#${tag}`} sx={{ mr: 1 }} />
            ))}
          </Box>
        )}
        <Box display="flex" alignItems="center">
          <IconButton onClick={handleLikeClick} color={likedByUser ? 'error' : 'default'}>
            {likedByUser ? <Favorite /> : <FavoriteBorder />}
          </IconButton>
          <Typography variant="body2" sx={{ mr: 2 }}>{post.likes.length}</Typography>
          <IconButton onClick={() => setShowComments(!showComments)}>
            <ChatBubbleOutline />
          </IconButton>
          <Typography variant="body2">{post.comments.length}</Typography>
        </Box>
        {showComments && (
          <Box sx={{ mt: 2 }}>
            {post.comments.map((c, idx) => (
              <Box key={idx} sx={{ mb: 1 }}>
                <Typography variant="subtitle2">{c.username}</Typography>
                <Typography variant="body2">{c.description}</Typography>
              </Box>
            ))}
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <TextField
                size="small"
                fullWidth
                placeholder="Write a comment..."
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
              />
              <Button size="small" onClick={submitComment}>Send</Button>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default PostComponent;