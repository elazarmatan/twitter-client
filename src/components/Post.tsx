import React from 'react';
import { Typography, Avatar, Box, Chip, IconButton, TextField, Button } from '@mui/material';
import { Favorite, FavoriteBorder, ChatBubbleOutline } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { getUser } from '../api';

interface Comment { username: string; description: string; }
interface Post {
  id: number; username: string; description: string;
  likes: string[]; comments: Comment[]; image?: string; tags?: string[];
}
interface PostProps {
  post: Post; currentUser?: string;
  onLike?: () => void; onUnlike?: () => void; onComment?: (d: string) => void;
}

const PostComponent: React.FC<PostProps> = ({ post, currentUser, onLike, onUnlike, onComment }) => {
  const [showComments, setShowComments] = React.useState(false);
  const [newComment, setNewComment] = React.useState('');
  const [imgExpanded, setImgExpanded] = React.useState(false);
  const likedByUser = currentUser ? post.likes.includes(currentUser) : false;

  const { data: postUser } = useQuery({
    queryKey: ['user', post.username],
    queryFn: () => getUser(post.username),
  });

  return (
    <Box sx={{
      borderBottom: '1px solid #2f3336', px: { xs: 2, sm: 3 }, py: 2,
      display: 'flex', gap: 1.5,
      '&:hover': { bgcolor: 'rgba(255,255,255,0.025)' },
      transition: 'background 0.12s',
    }}>
      {/* Avatar */}
      <Avatar
        src={postUser?.image ? `http://localhost:3000${postUser.image}` : undefined}
        sx={{ width: 40, height: 40, flexShrink: 0, mt: 0.3, cursor: 'pointer' }}
      >
        {post.username[0].toUpperCase()}
      </Avatar>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        {/* Header */}
        <Box display="flex" alignItems="center" gap={0.5} mb={0.2} flexWrap="wrap">
          <Typography variant="body2" fontWeight={700}
            sx={{ color: '#e7e9ea', '&:hover': { textDecoration: 'underline', cursor: 'pointer' } }}>
            {postUser?.name || post.username}
          </Typography>
          <Typography variant="body2" sx={{ color: '#71767b' }}>@{post.username}</Typography>
        </Box>

        {/* Text */}
        {post.description && (
          <Typography variant="body1"
            sx={{ color: '#e7e9ea', mb: 1.5, lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.95rem' }}>
            {post.description}
          </Typography>
        )}

        {/* Image — Twitter style */}
        {post.image && (
          <Box
            onClick={() => setImgExpanded(!imgExpanded)}
            sx={{
              mb: 1.5,
              borderRadius: '16px',
              overflow: 'hidden',
              border: '1px solid #2f3336',
              cursor: 'pointer',
              position: 'relative',
              bgcolor: '#16181c',
              // Maintain aspect ratio like Twitter: max 560px wide, 16:9 ratio
              width: '100%',
              maxWidth: 560,
              aspectRatio: imgExpanded ? 'auto' : '16/9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              '&:hover::after': {
                content: '""',
                position: 'absolute',
                inset: 0,
                bgcolor: 'rgba(0,0,0,0.08)',
              },
            }}
          >
            <img
              src={post.image}
              alt="Post"
              style={{
                width: '100%',
                height: imgExpanded ? 'auto' : '100%',
                objectFit: imgExpanded ? 'contain' : 'cover',
                display: 'block',
                maxHeight: imgExpanded ? 600 : undefined,
              }}
            />
          </Box>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <Box mb={1} sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.3 }}>
            {post.tags.map((tag, i) => (
              <Typography key={i} component="span" sx={{ color: '#1d9bf0', fontSize: '0.9rem', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                #{tag}{' '}
              </Typography>
            ))}
          </Box>
        )}

        {/* Action bar */}
        <Box display="flex" alignItems="center" gap={0.5} mt={0.5} sx={{ ml: -0.5 }}>
          {/* Comment */}
          <Box display="flex" alignItems="center">
            <IconButton onClick={() => setShowComments(!showComments)} size="small"
              sx={{ color: '#71767b', '&:hover': { color: '#1d9bf0', bgcolor: 'rgba(29,155,240,0.1)' }, p: '6px' }}>
              <ChatBubbleOutline sx={{ fontSize: '1.1rem' }} />
            </IconButton>
            <Typography variant="caption" sx={{ color: showComments ? '#1d9bf0' : '#71767b', minWidth: 16, fontSize: '0.8rem' }}>
              {post.comments.length || ''}
            </Typography>
          </Box>

          {/* Like */}
          <Box display="flex" alignItems="center" sx={{ ml: 1 }}>
            <IconButton onClick={likedByUser ? onUnlike : onLike} size="small"
              sx={{ color: likedByUser ? '#f91880' : '#71767b', '&:hover': { color: '#f91880', bgcolor: 'rgba(249,24,128,0.1)' }, p: '6px' }}>
              {likedByUser
                ? <Favorite sx={{ fontSize: '1.1rem' }} />
                : <FavoriteBorder sx={{ fontSize: '1.1rem' }} />}
            </IconButton>
            <Typography variant="caption" sx={{ color: likedByUser ? '#f91880' : '#71767b', minWidth: 16, fontSize: '0.8rem' }}>
              {post.likes.length || ''}
            </Typography>
          </Box>
        </Box>

        {/* Comments section */}
        {showComments && (
          <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid #2f3336' }}>
            {post.comments.map((c, i) => (
              <Box key={i} sx={{ mb: 1.5, display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <Avatar sx={{ width: 28, height: 28, bgcolor: '#2f3336', fontSize: '0.75rem', flexShrink: 0 }}>
                  {c.username[0].toUpperCase()}
                </Avatar>
                <Box sx={{ bgcolor: '#16181c', borderRadius: 2, px: 1.5, py: 1, flex: 1 }}>
                  <Typography variant="caption" fontWeight={700} sx={{ color: '#e7e9ea', display: 'block' }}>
                    @{c.username}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#c4cfd6', fontSize: '0.85rem' }}>
                    {c.description}
                  </Typography>
                </Box>
              </Box>
            ))}
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <TextField size="small" fullWidth placeholder="Post your reply"
                value={newComment} onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), newComment.trim() && onComment?.(newComment.trim()) && setNewComment(''))}
                InputProps={{ sx: { color: '#e7e9ea', borderRadius: 20, fontSize: '0.9rem', '& fieldset': { borderColor: '#2f3336' }, '&:hover fieldset': { borderColor: '#536471' }, '&.Mui-focused fieldset': { borderColor: '#1d9bf0' } } }}
                inputProps={{ style: { color: '#e7e9ea', padding: '8px 14px' } }}
              />
              <Button size="small" onClick={() => { if (newComment.trim()) { onComment?.(newComment.trim()); setNewComment(''); } }}
                disabled={!newComment.trim()}
                sx={{ borderRadius: 20, px: 2, fontWeight: 700, bgcolor: '#1d9bf0', color: '#fff', textTransform: 'none', whiteSpace: 'nowrap', '&:hover': { bgcolor: '#1a8cd8' }, '&:disabled': { bgcolor: '#0f4f77', color: '#4d9db8' } }}>
                Reply
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default PostComponent;
