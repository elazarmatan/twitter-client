import React, { useState, useMemo } from 'react';
import {
  Box, Tabs, Tab, Typography, CircularProgress, Avatar, Button,
  TextField, Alert, Dialog, DialogTitle, DialogContent, DialogActions,
  AppBar, Toolbar, IconButton, Menu, MenuItem, useMediaQuery, useTheme,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PostComponent from './Post';
import SearchUsers from './SearchUsers';
import UserProfilePage from './UserProfilePage';
import { getPosts, likePost, unlikePost, addComment, getUser } from '../api';

interface User {
  username: string; id: number; name?: string;
  followers?: string[]; following?: string[]; image?: string; [key: string]: any;
}
interface HomePageProps { user?: User; token?: string; onLogout?: () => void; }

function TabPanel({ children, value, index }: any) {
  return <div role="tabpanel" hidden={value !== index}>{value === index && <Box>{children}</Box>}</div>;
}

const HomePage: React.FC<HomePageProps> = ({ user, token, onLogout }) => {
  const queryClient = useQueryClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isWide = useMediaQuery(theme.breakpoints.up('xl'));

  const [tabValue, setTabValue] = useState(0);
  const [createPostText, setCreatePostText] = useState('');
  const [createPostImage, setCreatePostImage] = useState<File | null>(null);
  const [openCreate, setOpenCreate] = useState(false);
  const [openSearch, setOpenSearch] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const { data: fullUser } = useQuery({
    queryKey: ['currentUser', user?.username],
    queryFn: () => getUser(user!.username),
    enabled: !!user?.username,
    staleTime: 0,
  });

  const { data: posts, isLoading, isError, error: queryError } = useQuery({
    queryKey: ['posts'], queryFn: getPosts, staleTime: 1000 * 30,
  });

  const followingUsernames = fullUser?.following || user?.following || [];
  const followingPosts = useMemo(() => {
    if (!posts || !followingUsernames.length) return [];
    return posts.filter((p) => followingUsernames.includes(p.username));
  }, [posts, followingUsernames]);

  const likeMutation = useMutation({ mutationFn: likePost, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts'] }) });
  const unlikeMutation = useMutation({ mutationFn: unlikePost, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts'] }) });
  const commentMutation = useMutation({ mutationFn: addComment, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts'] }) });
  const createPostMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch('http://localhost:3000/posts', {
        method: 'POST', body: formData, headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to create post');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts'] }),
  });

  if (!user) return <Typography>Loading...</Typography>;

  const postActions = (post: any) => ({
    onLike: () => likeMutation.mutate({ postId: post.id, username: user.username }),
    onUnlike: () => unlikeMutation.mutate({ postId: post.id, username: user.username }),
    onComment: (desc: string) => commentMutation.mutate({ postId: post.id, username: user.username, description: desc }),
  });

  const renderFeed = (postList: any[]) =>
    postList.map((post) => <PostComponent key={post.id} post={post} currentUser={user.username} {...postActions(post)} />);

  return (
    <Box sx={{ bgcolor: '#000', minHeight: '100vh' }}>
      {/* Mobile AppBar */}
      {isMobile && (
        <AppBar position="sticky" elevation={0}
          sx={{ bgcolor: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #2f3336' }}>
          <Toolbar sx={{ px: 2, minHeight: '52px !important' }}>
            <Typography variant="h5" sx={{ flexGrow: 1, fontWeight: 900, color: '#fff' }}>𝕏</Typography>
            <IconButton onClick={() => setOpenSearch(true)} sx={{ color: '#e7e9ea' }}><SearchIcon /></IconButton>
            <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)} sx={{ ml: 0.5, p: 0.5 }}>
              <Avatar src={user.image ? `http://localhost:3000${user.image}` : undefined}
                sx={{ width: 32, height: 32, border: '2px solid #1d9bf0' }}>
                {user.username[0].toUpperCase()}
              </Avatar>
            </IconButton>
          </Toolbar>
        </AppBar>
      )}

      {/* Page layout */}
      <Box sx={{ display: 'flex', maxWidth: isWide ? 1400 : 1200, mx: 'auto' }}>

        {/* LEFT SIDEBAR */}
        {!isMobile && (
          <Box sx={{
            width: isWide ? 275 : 88,
            flexShrink: 0, position: 'sticky', top: 0, height: '100vh',
            display: 'flex', flexDirection: 'column',
            px: isWide ? 2 : 1, py: 3,
            borderRight: '1px solid #2f3336',
          }}>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#fff', mb: 3, pl: isWide ? 1 : 0.5, fontSize: '2rem', cursor: 'default' }}>
              𝕏
            </Typography>

            {[{ icon: '🏠', label: 'Home' }, { icon: '🔍', label: 'Explore', action: () => setOpenSearch(true) }].map((item) => (
              <Box key={item.label} onClick={item.action}
                sx={{
                  display: 'flex', alignItems: 'center', gap: isWide ? 2 : 0,
                  justifyContent: isWide ? 'flex-start' : 'center',
                  px: isWide ? 2 : 1.5, py: 1.5, borderRadius: 30,
                  cursor: item.action ? 'pointer' : 'default', mb: 0.5,
                  '&:hover': { bgcolor: 'rgba(239,243,244,0.1)' },
                }}>
                <Typography sx={{ fontSize: '1.3rem' }}>{item.icon}</Typography>
                {isWide && <Typography sx={{ color: '#e7e9ea', fontWeight: 600, fontSize: '1.1rem' }}>{item.label}</Typography>}
              </Box>
            ))}

            <Button variant="contained" onClick={() => setOpenCreate(true)}
              sx={{
                mt: 2, borderRadius: 30, py: 1.5, fontWeight: 800, bgcolor: '#1d9bf0',
                textTransform: 'none', minWidth: 0,
                px: isWide ? 3 : 0, width: isWide ? '100%' : 48, height: isWide ? 'auto' : 48,
                fontSize: isWide ? '1rem' : '1.3rem',
                '&:hover': { bgcolor: '#1a8cd8' },
              }}>
              {isWide ? 'Post' : '+'}
            </Button>

            <Box sx={{ mt: 'auto' }}>
              <Box onClick={(e) => setMenuAnchor(e.currentTarget)}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5,
                  justifyContent: isWide ? 'flex-start' : 'center',
                  p: 1.5, borderRadius: 30, cursor: 'pointer',
                  '&:hover': { bgcolor: 'rgba(239,243,244,0.1)' },
                }}>
                <Avatar src={user.image ? `http://localhost:3000${user.image}` : undefined}
                  sx={{ width: 40, height: 40, border: '2px solid #2f3336', flexShrink: 0 }}>
                  {user.username[0].toUpperCase()}
                </Avatar>
                {isWide && (
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={700} sx={{ color: '#e7e9ea', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.name || user.username}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#71767b' }}>@{user.username}</Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        )}

        {/* CENTER FEED */}
        <Box sx={{ flex: 1, maxWidth: 600, borderRight: '1px solid #2f3336', minHeight: '100vh' }}>
          {/* Desktop compose */}
          {!isMobile && (
            <Box onClick={() => setOpenCreate(true)}
              sx={{
                position: 'sticky', top: 0, zIndex: 10,
                bgcolor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
                borderBottom: '1px solid #2f3336',
                px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer',
              }}>
              <Avatar src={user.image ? `http://localhost:3000${user.image}` : undefined} sx={{ width: 40, height: 40 }}>
                {user.username[0].toUpperCase()}
              </Avatar>
              <Box sx={{ flex: 1, px: 2, py: 1.2, borderRadius: 20, bgcolor: '#16181c', border: '1px solid #2f3336' }}>
                <Typography sx={{ color: '#71767b', fontSize: '1rem' }}>What is happening?!</Typography>
              </Box>
            </Box>
          )}

          {/* Tabs */}
          <Box sx={{ position: 'sticky', top: isMobile ? 52 : 73, zIndex: 9, bgcolor: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #2f3336' }}>
            <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} variant="fullWidth"
              TabIndicatorProps={{ style: { backgroundColor: '#1d9bf0', height: 3, borderRadius: 3 } }}
              sx={{ '& .MuiTab-root': { color: '#71767b', fontWeight: 700, textTransform: 'none', minHeight: 52, '&.Mui-selected': { color: '#e7e9ea' }, '&:hover': { bgcolor: 'rgba(239,243,244,0.05)' } } }}>
              <Tab label="For you" />
              <Tab label={`Following${followingUsernames.length > 0 ? ` (${followingPosts.length})` : ''}`} />
            </Tabs>
          </Box>

          {/* Mobile FAB */}
          {isMobile && (
            <Box sx={{ position: 'fixed', bottom: 24, right: 20, zIndex: 100 }}>
              <Button variant="contained" onClick={() => setOpenCreate(true)}
                sx={{ borderRadius: 30, minWidth: 56, width: 56, height: 56, p: 0, bgcolor: '#1d9bf0', fontSize: '1.5rem', '&:hover': { bgcolor: '#1a8cd8' }, boxShadow: '0 4px 16px rgba(29,155,240,0.4)' }}>
                ✎
              </Button>
            </Box>
          )}

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress sx={{ color: '#1d9bf0' }} /></Box>
          ) : isError ? (
            <Typography color="error" sx={{ p: 3 }}>{(queryError as Error)?.message}</Typography>
          ) : (
            <>
              <TabPanel value={tabValue} index={0}>
                {!posts?.length ? <Typography sx={{ color: '#71767b', textAlign: 'center', py: 6 }}>No posts yet.</Typography> : renderFeed(posts)}
              </TabPanel>
              <TabPanel value={tabValue} index={1}>
                {!followingUsernames.length ? (
                  <Box sx={{ textAlign: 'center', py: 8, px: 4 }}>
                    <Typography variant="h6" sx={{ color: '#e7e9ea', fontWeight: 800, mb: 1 }}>Follow people to see their posts</Typography>
                    <Typography sx={{ color: '#71767b' }}>When you follow accounts, their posts will show up here.</Typography>
                  </Box>
                ) : !followingPosts.length ? (
                  <Box sx={{ textAlign: 'center', py: 8, px: 4 }}>
                    <Typography variant="h6" sx={{ color: '#e7e9ea', fontWeight: 800, mb: 1 }}>No posts yet</Typography>
                    <Typography sx={{ color: '#71767b' }}>The people you follow haven't posted yet.</Typography>
                  </Box>
                ) : renderFeed(followingPosts)}
              </TabPanel>
            </>
          )}
        </Box>

        {/* RIGHT PANEL — xl only */}
        {isWide && (
          <Box sx={{ width: 350, flexShrink: 0, position: 'sticky', top: 0, height: '100vh', px: 3, py: 3, overflowY: 'auto' }}>
            <Box onClick={() => setOpenSearch(true)}
              sx={{ display: 'flex', alignItems: 'center', bgcolor: '#16181c', borderRadius: 30, px: 2, py: 1, mb: 3, border: '1px solid #2f3336', cursor: 'pointer', '&:hover': { borderColor: '#1d9bf0' } }}>
              <SearchIcon sx={{ color: '#71767b', mr: 1, fontSize: '1.1rem' }} />
              <Typography sx={{ color: '#71767b', fontSize: '0.95rem' }}>Search</Typography>
            </Box>
            <Box sx={{ bgcolor: '#16181c', borderRadius: 4, border: '1px solid #2f3336', overflow: 'hidden' }}>
              <Typography variant="h6" fontWeight={800} sx={{ color: '#e7e9ea', px: 3, py: 2, fontSize: '1.1rem' }}>Profile</Typography>
              <Box sx={{ px: 3, pb: 3, display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }} onClick={() => setSelectedUser(user.username)}>
                <Avatar src={user.image ? `http://localhost:3000${user.image}` : undefined} sx={{ width: 44, height: 44 }}>
                  {user.username[0].toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="body2" fontWeight={700} sx={{ color: '#e7e9ea' }}>{user.name || user.username}</Typography>
                  <Typography variant="caption" sx={{ color: '#71767b' }}>@{user.username}</Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        )}
      </Box>

      {/* User menu */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}
        PaperProps={{ sx: { bgcolor: '#000', border: '1px solid #2f3336', borderRadius: 3, minWidth: 220, boxShadow: '0 8px 32px rgba(255,255,255,0.08)' } }}>
        <MenuItem onClick={() => { setMenuAnchor(null); setSelectedUser(user.username); }}
          sx={{ color: '#e7e9ea', gap: 1.5, '&:hover': { bgcolor: '#080808' } }}>
          <Avatar src={user.image ? `http://localhost:3000${user.image}` : undefined} sx={{ width: 32, height: 32 }}>
            {user.username[0].toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={700} sx={{ color: '#e7e9ea' }}>{user.name || user.username}</Typography>
            <Typography variant="caption" sx={{ color: '#71767b' }}>@{user.username}</Typography>
          </Box>
        </MenuItem>
        <Box sx={{ borderTop: '1px solid #2f3336', my: 0.5 }} />
        <MenuItem onClick={() => { setMenuAnchor(null); onLogout?.(); }}
          sx={{ color: '#f4212e', fontWeight: 700, '&:hover': { bgcolor: 'rgba(244,33,46,0.1)' } }}>
          Log out @{user.username}
        </MenuItem>
      </Menu>

      {/* Search Dialog */}
      <Dialog open={openSearch} onClose={() => setOpenSearch(false)} fullWidth maxWidth="sm"
        PaperProps={{ sx: { bgcolor: '#000', border: '1px solid #2f3336', borderRadius: 4 } }}>
        <DialogTitle sx={{ color: '#e7e9ea', fontWeight: 700 }}>Search Users</DialogTitle>
        <DialogContent>
          <SearchUsers onUserClick={(username) => { setSelectedUser(username); setOpenSearch(false); }} />
        </DialogContent>
      </Dialog>

      {/* Create Post Dialog */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} fullWidth maxWidth="sm"
        PaperProps={{ sx: { bgcolor: '#000', border: '1px solid #2f3336', borderRadius: 4 } }}>
        <DialogTitle sx={{ color: '#e7e9ea', fontWeight: 700 }}>New Post</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Avatar src={user.image ? `http://localhost:3000${user.image}` : undefined} sx={{ width: 40, height: 40 }}>
              {user.username[0].toUpperCase()}
            </Avatar>
            <TextField fullWidth multiline rows={4} placeholder="What is happening?!" value={createPostText}
              onChange={(e) => setCreatePostText(e.target.value)}
              InputProps={{ sx: { color: '#e7e9ea', fontSize: '1.1rem', '& fieldset': { borderColor: '#2f3336' }, '&:hover fieldset': { borderColor: '#536471' }, '&.Mui-focused fieldset': { borderColor: '#1d9bf0' } } }}
              inputProps={{ style: { color: '#e7e9ea' } }} />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button component="label" size="small" sx={{ color: '#1d9bf0', textTransform: 'none', borderRadius: 20 }}>
              📷 Add image
              <input type="file" accept="image/*" hidden onChange={(e) => setCreatePostImage(e.target.files?.[0] || null)} />
            </Button>
            {createPostImage && <Typography variant="caption" sx={{ color: '#71767b' }}>{createPostImage.name}</Typography>}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenCreate(false)} sx={{ color: '#71767b', borderRadius: 20, textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" disabled={createPostMutation.isPending || !createPostText.trim()}
            onClick={() => {
              const fd = new FormData();
              fd.append('username', user.username);
              fd.append('description', createPostText);
              if (createPostImage) fd.append('image', createPostImage);
              createPostMutation.mutate(fd, {
                onSuccess: () => { setCreatePostText(''); setCreatePostImage(null); setOpenCreate(false); setError(null); },
                onError: (err: any) => setError(err.message),
              });
            }}
            sx={{ borderRadius: 20, fontWeight: 700, bgcolor: '#1d9bf0', '&:hover': { bgcolor: '#1a8cd8' }, textTransform: 'none' }}>
            {createPostMutation.isPending ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Post'}
          </Button>
        </DialogActions>
      </Dialog>

      {selectedUser && <UserProfilePage username={selectedUser} currentUser={user.username} onClose={() => setSelectedUser(null)} />}
    </Box>
  );
};

export default HomePage;
