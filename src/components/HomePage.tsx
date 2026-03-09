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
  return (
    <div role="tabpanel" hidden={value !== index} style={{ height: '100%' }}>
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

const APPBAR_H = 56;
const TABS_H = 52;
// const COMPOSE_H = 73; // desktop compose strip height

const HomePage: React.FC<HomePageProps> = ({ user, token, onLogout }) => {
  const queryClient = useQueryClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isWide = useMediaQuery(theme.breakpoints.up('lg'));

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
      const res = await fetch(`${import.meta.env.VITE_API_URL}/posts`, {
        method: 'POST', body: formData, headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to create post');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts'] }),
  });

  if (!user) return <Typography>Loading...</Typography>;

  const makePostActions = (post: any) => ({
    onLike: () => likeMutation.mutate({ postId: post.id, username: user.username }),
    onUnlike: () => unlikeMutation.mutate({ postId: post.id, username: user.username }),
    onComment: (desc: string) => commentMutation.mutate({ postId: post.id, username: user.username, description: desc }),
  });

  const renderFeed = (postList: any[]) =>
    postList.map((post) => (
      <PostComponent key={post.id} post={post} currentUser={user.username} {...makePostActions(post)} />
    ));

  // How tall is the sticky header inside the feed column:
//   // desktop = compose (73) + tabs (52), mobile = tabs (52) only
//   const feedStickyHeaderH = isMobile ? TABS_H : COMPOSE_H + TABS_H;
//   // Total fixed height above the scrollable feed list
//   const feedScrollTop = APPBAR_H + feedStickyHeaderH;

  return (
    /**
     * Root: full viewport, no overflow — nothing on the page scrolls except
     * the feed list itself.
     */
    <Box sx={{ bgcolor: '#000', width: '100%', height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

      {/* ── TOP APPBAR ── */}
      <AppBar
        position="static"   // static so it stays in flex flow, not position:fixed
        elevation={0}
        sx={{
          bgcolor: 'rgba(0,0,0,0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #2f3336',
          height: APPBAR_H,
          flexShrink: 0,
          zIndex: theme.zIndex.appBar,
        }}
      >
        <Toolbar sx={{ width: '100%', px: { xs: 2, sm: 3 }, minHeight: `${APPBAR_H}px !important`, height: APPBAR_H }}>
          <Typography variant="h5" sx={{ fontWeight: 900, color: '#fff', mr: 2, fontSize: '1.5rem', userSelect: 'none' }}>
            𝕏
          </Typography>
          <Box sx={{ flex: 1 }} />
          <IconButton onClick={() => setOpenSearch(true)} sx={{ color: '#e7e9ea', '&:hover': { bgcolor: 'rgba(239,243,244,0.1)' } }}>
            <SearchIcon />
          </IconButton>
          <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)} sx={{ ml: 1, p: 0.5 }}>
            <Avatar
              src={user.image ? `http://localhost:3000${user.image}` : undefined}
              sx={{ width: 34, height: 34, border: '2px solid #1d9bf0' }}
            >
              {user.username[0].toUpperCase()}
            </Avatar>
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* ── BODY ROW: sidebar + feed (fills remaining viewport height) ── */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden', width: '100%' }}>

        {/* LEFT NAV */}
        {!isMobile && (
          <Box
            sx={{
              width: isWide ? 240 : 72,
              flexShrink: 0,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              px: isWide ? 2 : 1,
              py: 2,
              borderRight: '1px solid #2f3336',
              bgcolor: '#000',
              overflowY: 'auto',
            }}
          >
            {[
              { icon: '🏠', label: 'Home' },
              { icon: '🔍', label: 'Explore', action: () => setOpenSearch(true) },
            ].map((item) => (
              <Box
                key={item.label}
                onClick={item.action}
                sx={{
                  display: 'flex', alignItems: 'center',
                  justifyContent: isWide ? 'flex-start' : 'center',
                  gap: isWide ? 2 : 0,
                  px: isWide ? 2 : 1, py: 1.5,
                  borderRadius: 30, mb: 0.5,
                  cursor: item.action ? 'pointer' : 'default',
                  '&:hover': { bgcolor: 'rgba(239,243,244,0.08)' },
                  transition: 'background 0.15s',
                }}
              >
                <Typography sx={{ fontSize: '1.3rem', lineHeight: 1 }}>{item.icon}</Typography>
                {isWide && (
                  <Typography sx={{ color: '#e7e9ea', fontWeight: 600, fontSize: '1.05rem' }}>
                    {item.label}
                  </Typography>
                )}
              </Box>
            ))}

            <Button
              variant="contained"
              onClick={() => setOpenCreate(true)}
              sx={{
                mt: 2, borderRadius: 30, fontWeight: 800, bgcolor: '#1d9bf0',
                textTransform: 'none',
                ...(isWide
                  ? { width: '100%', py: 1.5, fontSize: '1rem' }
                  : { minWidth: 0, width: 46, height: 46, p: 0, fontSize: '1.4rem', mx: 'auto' }),
                '&:hover': { bgcolor: '#1a8cd8' },
              }}
            >
              {isWide ? 'Post' : '+'}
            </Button>

            <Box sx={{ mt: 'auto' }}>
              <Box
                onClick={(e) => setMenuAnchor(e.currentTarget)}
                sx={{
                  display: 'flex', alignItems: 'center',
                  justifyContent: isWide ? 'flex-start' : 'center',
                  gap: 1.5, p: 1.5, borderRadius: 30, cursor: 'pointer',
                  '&:hover': { bgcolor: 'rgba(239,243,244,0.08)' },
                }}
              >
                <Avatar
                  src={user.image ? `http://localhost:3000${user.image}` : undefined}
                  sx={{ width: 38, height: 38, flexShrink: 0 }}
                >
                  {user.username[0].toUpperCase()}
                </Avatar>
                {isWide && (
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={700}
                      sx={{ color: '#e7e9ea', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.name || user.username}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#71767b' }}>{user.username}</Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        )}

        {/* ── CENTER FEED COLUMN ── */}
        <Box
          sx={{
            flex: 1,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid #2f3336',
            }}
        >
          {/* Compose strip (desktop only) — sticky inside column, not scrollable */}
          {!isMobile && (
            <Box
              onClick={() => setOpenCreate(true)}
              sx={{
                flexShrink: 0,
                bgcolor: 'rgba(0,0,0,0.88)',
                backdropFilter: 'blur(12px)',
                borderBottom: '1px solid #2f3336',
                px: 2, py: 1.5,
                display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' },
              }}
            >
              <Avatar src={user.image ? `http://localhost:3000${user.image}` : undefined} sx={{ width: 40, height: 40 }}>
                {user.username[0].toUpperCase()}
              </Avatar>
              <Box sx={{ flex: 1, px: 2, py: 1.2, borderRadius: 20, bgcolor: '#16181c', border: '1px solid #2f3336' }}>
                <Typography sx={{ color: '#71767b', fontSize: '1rem' }}>What is happening?!</Typography>
              </Box>
            </Box>
          )}

          {/* Tabs — sticky inside column */}
          <Box
            sx={{
              flexShrink: 0,
              bgcolor: 'rgba(0,0,0,0.92)',
              backdropFilter: 'blur(12px)',
              borderBottom: '1px solid #2f3336',
            }}
          >
            <Tabs
              value={tabValue} onChange={(_, v) => setTabValue(v)} variant="fullWidth"
              TabIndicatorProps={{ style: { backgroundColor: '#1d9bf0', height: 3, borderRadius: 3 } }}
              sx={{
                '& .MuiTab-root': {
                  color: '#71767b', fontWeight: 700, textTransform: 'none', minHeight: TABS_H,
                  '&.Mui-selected': { color: '#e7e9ea' },
                  '&:hover': { bgcolor: 'rgba(239,243,244,0.05)' },
                },
              }}
            >
              <Tab label="For you" />
              <Tab label={`Following${followingUsernames.length > 0 ? ` (${followingPosts.length})` : ''}`} />
            </Tabs>
          </Box>

          {/* ✅ SCROLLABLE FEED LIST — only this overflows */}
          <Box sx={{
            flex: 1, overflowY: 'auto', overflowX: 'hidden',
            // Twitter-style scrollbar
            '&::-webkit-scrollbar': { width: 6 },
            '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: '#333639',
              borderRadius: 99,
              '&:hover': { bgcolor: '#4a4d51' },
            },
            scrollbarWidth: 'thin',
            scrollbarColor: '#333639 transparent',
          }}>
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
                <CircularProgress sx={{ color: '#1d9bf0' }} />
              </Box>
            ) : isError ? (
              <Typography color="error" sx={{ p: 3 }}>{(queryError as Error)?.message}</Typography>
            ) : (
              <>
                <TabPanel value={tabValue} index={0}>
                  {!posts?.length
                    ? <Typography sx={{ color: '#71767b', textAlign: 'center', py: 6 }}>No posts yet.</Typography>
                    : renderFeed(posts)}
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
        </Box>
      </Box>

      {/* Mobile FAB */}
      {isMobile && (
        <Box sx={{ position: 'fixed', bottom: 24, right: 20, zIndex: 200 }}>
          <Button variant="contained" onClick={() => setOpenCreate(true)}
            sx={{ borderRadius: '50%', minWidth: 56, width: 56, height: 56, p: 0, bgcolor: '#1d9bf0', fontSize: '1.4rem', '&:hover': { bgcolor: '#1a8cd8' }, boxShadow: '0 4px 20px rgba(29,155,240,0.5)' }}>
            ✎
          </Button>
        </Box>
      )}

      {/* ── MENUS & DIALOGS ── */}
      <Menu
        anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}
        PaperProps={{ sx: { bgcolor: '#000', border: '1px solid #2f3336', borderRadius: 3, minWidth: 220, boxShadow: '0 8px 32px rgba(255,255,255,0.08)' } }}
      >
        <MenuItem onClick={() => { setMenuAnchor(null); setTimeout(() => setSelectedUser(user.username), 50); }}
          sx={{ color: '#e7e9ea', gap: 1.5, '&:hover': { bgcolor: '#0d0d0d' } }}>
          <Avatar src={user.image ? `http://localhost:3000${user.image}` : undefined} sx={{ width: 32, height: 32 }}>
            {user.username[0].toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={700} sx={{ color: '#e7e9ea' }}>{user.name || user.username}</Typography>
            <Typography variant="caption" sx={{ color: '#71767b' }}>{user.username}</Typography>
          </Box>
        </MenuItem>
      </Menu>

      <Dialog open={openSearch} onClose={() => setOpenSearch(false)} fullWidth maxWidth="sm"
        PaperProps={{ sx: { bgcolor: '#000', border: '1px solid #2f3336', borderRadius: 4 } }}>
        <DialogTitle sx={{ color: '#e7e9ea', fontWeight: 700 }}>Search Users</DialogTitle>
        <DialogContent>
          <SearchUsers onUserClick={(u) => { setSelectedUser(u); setOpenSearch(false); }} />
        </DialogContent>
      </Dialog>

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
          <Button onClick={() => { setOpenCreate(false); setError(null); }} sx={{ color: '#71767b', borderRadius: 20, textTransform: 'none' }}>Cancel</Button>
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

      {selectedUser && (
        <UserProfilePage username={selectedUser} currentUser={user.username} onClose={() => setSelectedUser(null)} onLogout={onLogout} />
      )}
    </Box>
  );
};

export default HomePage;
