import React, { useState, useMemo } from 'react';
import {
  Container,
  Box,
  Tabs,
  Tab,
  Typography,
  CircularProgress,
  Card,
  CardContent,
  Avatar,
  Button,
  TextField,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  AppBar,
  Toolbar,
  IconButton,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PostComponent from './Post';
import UserProfile from './UserProfile';
import SearchUsers from './SearchUsers';
import UserProfilePage from './UserProfilePage';
import { getPosts, likePost, unlikePost, addComment } from '../api';

interface User {
  username: string;
  id: number;
  followers?: string[];
  following?: string[];
  image?: string;
  [key: string]: any;
}

interface HomePageProps {
  user?: User;
  token?: string;
  onLogout?: () => void;
}

function TabPanel(props: any) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const HomePage: React.FC<HomePageProps> = ({ user, token, onLogout }) => {
  const queryClient = useQueryClient();
  const [tabValue, setTabValue] = useState(0);
  const [createPostText, setCreatePostText] = useState('');
  const [createPostImage, setCreatePostImage] = useState<File | null>(null);
  const [openCreate, setOpenCreate] = useState(false);
  const [openSearch, setOpenSearch] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const {
    data: posts,
    isLoading,
    isError,
    error: queryError,
  } = useQuery({
    queryKey: ['posts'],
    queryFn: getPosts,
    staleTime: 1000 * 60, // 1 minute
  });

  const followingPosts = useMemo(() => {
    if (!posts || !user?.following) return [];
    return posts.filter(p => user.following!.includes(p.username));
  }, [posts, user?.following]);

  const likeMutation = useMutation({
    mutationFn: likePost,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts'] }),
  });
  const unlikeMutation = useMutation({
    mutationFn: unlikePost,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts'] }),
  });
  const commentMutation = useMutation({
    mutationFn: addComment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts'] }),
  });

  const createPostMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch('http://localhost:3000/posts', {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to create post');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts'] }),
  });

  if (!user) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Container maxWidth="lg">
      <AppBar position="sticky" sx={{ mb: 2 ,width:'95vw'}}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            🐦 Twitter
          </Typography>
          <IconButton color="inherit" onClick={() => setOpenSearch(true)}>
            <SearchIcon />
          </IconButton>
          <Avatar
            src={user.image ? `http://localhost:3000${user.image}` : undefined}
            sx={{ ml: 2, cursor: 'pointer' }}
            onClick={() => setSelectedUser(user.username)}
          >
            {user.username[0].toUpperCase()}
          </Avatar>
        </Toolbar>
      </AppBar>

      <Dialog open={openSearch} onClose={() => setOpenSearch(false)} fullWidth maxWidth="sm">
        <DialogTitle>Search Users</DialogTitle>
        <DialogContent>
          <SearchUsers onUserClick={(username) => {
            setSelectedUser(username);
            setOpenSearch(false);
          }} />
        </DialogContent>
      </Dialog>

      {selectedUser && (
        <UserProfilePage
          username={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 2, mt: 2 }}>
        {/* Main Feed - Left */}
        <Box>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" color="primary" onClick={() => setOpenCreate(true)}>
              New Post
            </Button>
          </Box>
          <Dialog open={openCreate} onClose={() => setOpenCreate(false)} fullWidth maxWidth="sm">
            <DialogTitle>Create Post</DialogTitle>
            <DialogContent>
              {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Avatar>{user.username[0].toUpperCase()}</Avatar>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="What's happening?!"
                  value={createPostText}
                  onChange={(e) => setCreatePostText(e.target.value)}
                  variant="outlined"
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCreatePostImage(e.target.files?.[0] || null)}
                />
                {createPostImage && <Typography variant="caption">{createPostImage.name}</Typography>}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
              <Button
                variant="contained"
                color="primary"
                disabled={createPostMutation.isPending || !createPostText.trim()}
                onClick={() => {
                  const formData = new FormData();
                  formData.append('username', user?.username || '');
                  formData.append('description', createPostText);
                  if (createPostImage) {
                    formData.append('image', createPostImage);
                  }
                  createPostMutation.mutate(formData, {
                    onSuccess: () => {
                      setCreatePostText('');
                      setCreatePostImage(null);
                      setOpenCreate(false);
                    },
                    onError: (err: any) => {
                      setError(err.message);
                    }
                  });
                }}
              >
                {createPostMutation.isPending ? <CircularProgress size={24} /> : 'Post'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Posts Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label="All Posts" id="tab-0" aria-controls="tabpanel-0" />
              <Tab label="Following" id="tab-1" aria-controls="tabpanel-1" />
            </Tabs>
          </Box>

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <CircularProgress />
            </Box>
          ) : isError ? (
            <Typography color="error">{(queryError as Error)?.message}</Typography>
          ) : (
            <>
              <TabPanel value={tabValue} index={0}>
                {posts && posts.length === 0 ? (
                  <Typography variant="body1">No posts yet.</Typography>
                ) : (
                  posts?.map((post) => (
                    <PostComponent
                      key={post.id}
                      post={post}
                      currentUser={user.username}
                      onLike={() => likeMutation.mutate({ postId: post.id, username: user.username })}
                      onUnlike={() => unlikeMutation.mutate({ postId: post.id, username: user.username })}
                      onComment={(description: string) =>
                        commentMutation.mutate({ postId: post.id, username: user.username, description })
                      }
                    />
                  ))
                )}
              </TabPanel>

              <TabPanel value={tabValue} index={1}>
                {followingPosts.length === 0 ? (
                  <Typography variant="body1">
                    {user.following?.length === 0 ? 'You are not following anyone yet.' : 'No posts from people you follow.'}
                  </Typography>
                ) : (
                  followingPosts.map((post) => (
                    <PostComponent
                      key={post.id}
                      post={post}
                      currentUser={user.username}
                      onLike={() => likeMutation.mutate({ postId: post.id, username: user.username })}
                      onUnlike={() => unlikeMutation.mutate({ postId: post.id, username: user.username })}
                      onComment={(description: string) =>
                        commentMutation.mutate({ postId: post.id, username: user.username, description })
                      }
                    />
                  ))
                )}
              </TabPanel>
            </>
          )}
        </Box>

        {/* Right Sidebar - User Profile */}
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <Card sx={{ position: 'sticky', top: 16 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Profile</Typography>
                {onLogout && (
                  <Button size="small" color="error" onClick={onLogout}>
                    Logout
                  </Button>
                )}
              </Box>
              <UserProfile username={user.username} currentUser={user.username} />
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Container>
  );
};

export default HomePage;
