import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Avatar,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  CircularProgress,
  IconButton,
  Button,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUser, getPosts, followUserApi, unfollowUserApi } from '../api';
import PostComponent from './Post';

interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  phone: string;
  bio?: string;
  image?: string;
  followers?: string[];
  following?: string[];
}

interface UserProfilePageProps {
  username: string;
  currentUser?: string;
  onClose: () => void;
  onLogout?: () => void;
}

function TabPanel(props: any) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

const UserProfilePage: React.FC<UserProfilePageProps> = ({ username, currentUser, onClose, onLogout }) => {
  const queryClient = useQueryClient();
  const [tabValue, setTabValue] = useState(0);
  const [followersList, setFollowersList] = useState<User[]>([]);
  const [followingList, setFollowingList] = useState<User[]>([]);

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['user', username],
    queryFn: () => getUser(username),
  });

  const { data: currentUserData } = useQuery({
    queryKey: ['user', currentUser],
    queryFn: () => getUser(currentUser!),
    enabled: !!currentUser,
  });

  const { data: allPosts } = useQuery({
    queryKey: ['posts'],
    queryFn: getPosts,
  });

  const isFollowing = currentUser
    ? (currentUserData?.following || []).includes(username)
    : false;

  const followMutation = useMutation({
    mutationFn: () => followUserApi({ currentUser: currentUser!, username }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', currentUser] });
      queryClient.invalidateQueries({ queryKey: ['user', username] });
      queryClient.invalidateQueries({ queryKey: ['currentUser', currentUser] });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: () => unfollowUserApi({ currentUser: currentUser!, username }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', currentUser] });
      queryClient.invalidateQueries({ queryKey: ['user', username] });
      queryClient.invalidateQueries({ queryKey: ['currentUser', currentUser] });
    },
  });

  const userPosts = allPosts?.filter((p) => p.username === username) || [];

  useEffect(() => {
    if (user) {
      if (user.followers && user.followers.length > 0) {
        Promise.all(
          user.followers.map(async (u) => {
            try {
              const r = await fetch(`${import.meta.env.VITE_API_URL}/users/findByUsername/${u}`);
              return r.ok ? await r.json() : null;
            } catch {
              return null;
            }
          })
        ).then((data) => setFollowersList(data.filter(Boolean)));
      } else {
        setFollowersList([]);
      }

      if (user.following && user.following.length > 0) {
        Promise.all(
          user.following.map(async (u) => {
            try {
              const r = await fetch(`${import.meta.env.VITE_API_URL}/users/findByUsername/${u}`);
              return r.ok ? await r.json() : null;
            } catch {
              return null;
            }
          })
        ).then((data) => setFollowingList(data.filter(Boolean)));
      } else {
        setFollowingList([]);
      }
    }
  }, [user]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Dialog
      open
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          bgcolor: '#000',
          border: '1px solid #2f3336',
          borderRadius: 4,
          height: '90vh',        // קבוע תמיד
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',    // הסקרול יהיה פנימה
        },
      }}
    >
      {/* Top bar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: 2,
          py: 1,
          borderBottom: '1px solid #2f3336',
          bgcolor: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(12px)',
          zIndex: 10,
          gap: 2,
          flexShrink: 0,
        }}
      >
        <IconButton onClick={onClose} size="small" sx={{ color: '#e7e9ea' }}>
          <ArrowBackIcon />
        </IconButton>
        {user && (
          <Box sx={{ flex: 1 }}>
            <Typography variant="body1" fontWeight={800} sx={{ color: '#e7e9ea', lineHeight: 1.2 }}>
              {user.name}
            </Typography>
            <Typography variant="caption" sx={{ color: '#71767b' }}>
              {userPosts.length} posts
            </Typography>
          </Box>
        )}
        {/* Logout — only shown on own profile */}
        {currentUser && currentUser === username && onLogout && (
          <Button
            size="small"
            onClick={() => { onClose(); onLogout(); }}
            sx={{
              borderRadius: 20,
              fontWeight: 700,
              textTransform: 'none',
              color: '#f4212e',
              border: '1px solid #f4212e',
              px: 2,
              '&:hover': { bgcolor: 'rgba(244,33,46,0.1)' },
            }}
          >
            Log out
          </Button>
        )}
      </Box>

      {/* Scrollable content */}
      <DialogContent
        sx={{
          p: 0,
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          '&::-webkit-scrollbar': { width: 6 },
          '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
          '&::-webkit-scrollbar-thumb': { bgcolor: '#333639', borderRadius: 99 },
          scrollbarWidth: 'thin',
          scrollbarColor: '#333639 transparent',
        }}
      >
        {userLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#1d9bf0' }} />
          </Box>
        ) : !user ? (
          <Typography sx={{ color: '#71767b', textAlign: 'center', py: 6 }}>
            User not found
          </Typography>
        ) : (
          <>
            {/* Profile Header */}
            <Box
              sx={{
                height: 120,
                bgcolor: '#1d9bf0',
                background: 'linear-gradient(135deg, #1d9bf0 0%, #0d47a1 100%)',
              }}
            />
            <Box sx={{ px: 3, pb: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  mt: -5,
                  mb: 1,
                }}
              >
                <Avatar
                  src={user.image ? `http://localhost:3000${user.image}` : undefined}
                  sx={{
                    width: 80,
                    height: 80,
                    border: '4px solid #000',
                    bgcolor: '#2f3336',
                    fontSize: '2rem',
                  }}
                >
                  {user.name[0].toUpperCase()}
                </Avatar>
                {currentUser && currentUser !== username && (
                  <Button
                    variant={isFollowing ? 'outlined' : 'contained'}
                    size="small"
                    onClick={() => isFollowing ? unfollowMutation.mutate() : followMutation.mutate()}
                    disabled={followMutation.isPending || unfollowMutation.isPending}
                    sx={
                      isFollowing
                        ? {
                            borderRadius: 20,
                            fontWeight: 700,
                            textTransform: 'none',
                            color: '#e7e9ea',
                            borderColor: '#536471',
                            mt: 6,
                            '&:hover': {
                              borderColor: '#f4212e',
                              color: '#f4212e',
                              bgcolor: 'rgba(244,33,46,0.1)',
                            },
                          }
                        : {
                            borderRadius: 20,
                            fontWeight: 700,
                            textTransform: 'none',
                            bgcolor: '#e7e9ea',
                            color: '#000',
                            mt: 6,
                            '&:hover': { bgcolor: '#d7d9da' },
                          }
                    }
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </Button>
                )}
              </Box>

              <Typography variant="h6" fontWeight={800} sx={{ color: '#e7e9ea', lineHeight: 1.2 }}>
                {user.name}
              </Typography>
              <Typography variant="body2" sx={{ color: '#71767b', mb: 1 }}>
                {user.username}
              </Typography>
              {user.bio && (
                <Typography variant="body1" sx={{ color: '#e7e9ea', mb: 1.5, lineHeight: 1.5 }}>
                  {user.bio}
                </Typography>
              )}
              <Box sx={{ display: 'flex', gap: 0.5, mb: 1, flexWrap: 'wrap' }}>
                <Typography variant="body2" sx={{ color: '#71767b' }}>
                  📧 {user.email}
                </Typography>
                <Typography variant="body2" sx={{ color: '#71767b' }}>
                  · 📱 {user.phone}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 2.5, mt: 1 }}>
                <Box>
                  <Typography
                    variant="body2"
                    component="span"
                    fontWeight={700}
                    sx={{ color: '#e7e9ea' }}
                  >
                    {user.following?.length || 0}
                  </Typography>
                  <Typography
                    variant="body2"
                    component="span"
                    sx={{ color: '#71767b', ml: 0.5 }}
                  >
                    Following
                  </Typography>
                </Box>
                <Box>
                  <Typography
                    variant="body2"
                    component="span"
                    fontWeight={700}
                    sx={{ color: '#e7e9ea' }}
                  >
                    {user.followers?.length || 0}
                  </Typography>
                  <Typography
                    variant="body2"
                    component="span"
                    sx={{ color: '#71767b', ml: 0.5 }}
                  >
                    Followers
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Tabs */}
            <Box
              sx={{
                borderBottom: '1px solid #2f3336',
                position: 'sticky',
                top: 56,
                bgcolor: 'rgba(0,0,0,0.9)',
                backdropFilter: 'blur(12px)',
                zIndex: 5,
              }}
            >
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                variant="fullWidth"
                TabIndicatorProps={{
                  style: { backgroundColor: '#1d9bf0', height: 3, borderRadius: 3 },
                }}
                sx={{
                  '& .MuiTab-root': {
                    color: '#71767b',
                    fontWeight: 700,
                    textTransform: 'none',
                    '&.Mui-selected': { color: '#e7e9ea' },
                    '&:hover': { bgcolor: 'rgba(239,243,244,0.05)' },
                  },
                }}
              >
                <Tab label="Posts" />
                <Tab label={`Followers (${followersList.length})`} />
                <Tab label={`Following (${followingList.length})`} />
              </Tabs>
            </Box>

            {/* Tab Panels */}
            <TabPanel value={tabValue} index={0}>
              {userPosts.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Typography variant="h6" fontWeight={800} sx={{ color: '#e7e9ea', mb: 1 }}>
                    No posts yet
                  </Typography>
                  <Typography sx={{ color: '#71767b' }}>
                    When {user.name} posts, it'll show up here.
                  </Typography>
                </Box>
              ) : (
                userPosts.map((post) => (
                  <PostComponent key={post.id} post={post} currentUser={currentUser} />
                ))
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <List disablePadding>
                {followersList.filter((f) => f?.name).length > 0 ? (
                  followersList.filter((f) => f?.name).map((follower) => (
                    <ListItem
                      key={follower.id}
                      sx={{
                        borderBottom: '1px solid #2f3336',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' },
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          src={follower.image ? `http://localhost:3000${follower.image}` : undefined}
                          sx={{ border: '1px solid #2f3336' }}
                        >
                          {follower.name[0].toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography fontWeight={700} sx={{ color: '#e7e9ea' }}>
                            {follower.name}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" sx={{ color: '#71767b' }}>
                            {follower.username}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))
                ) : (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Typography sx={{ color: '#71767b' }}>No followers yet</Typography>
                  </Box>
                )}
              </List>
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <List disablePadding>
                {followingList.filter((f) => f?.name).length > 0 ? (
                  followingList.filter((f) => f?.name).map((f) => (
                    <ListItem
                      key={f.id}
                      sx={{
                        borderBottom: '1px solid #2f3336',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' },
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          src={f.image ? `http://localhost:3000${f.image}` : undefined}
                          sx={{ border: '1px solid #2f3336' }}
                        >
                          {f.name[0].toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography fontWeight={700} sx={{ color: '#e7e9ea' }}>
                            {f.name}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" sx={{ color: '#71767b' }}>
                            {f.username}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))
                ) : (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Typography sx={{ color: '#71767b' }}>Not following anyone yet</Typography>
                  </Box>
                )}
              </List>
            </TabPanel>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UserProfilePage;
