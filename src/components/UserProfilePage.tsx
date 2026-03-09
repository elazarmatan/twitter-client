import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
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
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { getUser } from '../api';
import PostComponent from './Post';
import { getPosts } from '../api';

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
  onClose: () => void;
}

function TabPanel(props: any) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const UserProfilePage: React.FC<UserProfilePageProps> = ({ username, onClose }) => {
  const [tabValue, setTabValue] = useState(0);
  const [followersList, setFollowersList] = useState<User[]>([]);
  const [followingList, setFollowingList] = useState<User[]>([]);

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['user', username],
    queryFn: () => getUser(username),
  });

  const { data: allPosts } = useQuery({
    queryKey: ['posts'],
    queryFn: getPosts,
  });

  const userPosts = allPosts?.filter(p => p.username === username) || [];

  useEffect(() => {
    if (user) {
      // Fetch followers details
      if (user.followers && user.followers.length > 0) {
        Promise.all(
          user.followers.map(async (followerUsername) => {
            try {
              const response = await fetch(`http://localhost:3000/users/findByUsername/${followerUsername}`);
              if (response.ok) {
                return await response.json();
              }
              return null;
            } catch (err) {
              console.error(`Failed to fetch follower ${followerUsername}:`, err);
              return null;
            }
          })
        ).then(data => setFollowersList(data.filter(f => f !== null))).catch(console.error);
      }

      // Fetch following details
      if (user.following && user.following.length > 0) {
        Promise.all(
          user.following.map(async (followingUsername) => {
            try {
              const response = await fetch(`http://localhost:3000/users/findByUsername/${followingUsername}`);
              if (response.ok) {
                return await response.json();
              }
              return null;
            } catch (err) {
              console.error(`Failed to fetch following ${followingUsername}:`, err);
              return null;
            }
          })
        ).then(data => setFollowingList(data.filter(f => f !== null))).catch(console.error);
      }
    }
  }, [user]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (userLoading) {
    return (
      <Dialog open onClose={onClose} fullWidth maxWidth="md">
        <DialogContent sx={{ display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </DialogContent>
      </Dialog>
    );
  }

  if (!user) {
    return (
      <Dialog open onClose={onClose} fullWidth maxWidth="md">
        <DialogContent>
          <Typography>User not found</Typography>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar src={user.image ? `http://localhost:3000${user.image}` : undefined} sx={{ width: 60, height: 60 }}>
          {user.name[0]}
        </Avatar>
        <Box>
          <Typography variant="h6">{user.name}</Typography>
          <Typography variant="body2" color="textSecondary">{user.username}</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Posts" />
            <Tab label="Followers" />
            <Tab label="Following" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {userPosts.length === 0 ? (
            <Typography>No posts yet</Typography>
          ) : (
            userPosts.map(post => <PostComponent key={post.id} post={post} />)
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <List>
            {followersList.filter(follower => follower && follower.name).length > 0 ? followersList.filter(follower => follower && follower.name).map(follower => (
              <ListItem key={follower.id}>
                <ListItemAvatar>
                  <Avatar src={follower.image ? `http://localhost:3000${follower.image}` : undefined}>
                    {follower.name ? follower.name[0].toUpperCase() : '?'}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText primary={follower.name} secondary={follower.username} />
              </ListItem>
            )) : <Typography>No followers</Typography>}
          </List>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <List>
            {followingList.filter(following => following && following.name).length > 0 ? followingList.filter(following => following && following.name).map(following => (
              <ListItem key={following.id}>
                <ListItemAvatar>
                  <Avatar src={following.image ? `http://localhost:3000${following.image}` : undefined}>
                    {following.name ? following.name[0].toUpperCase() : '?'}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText primary={following.name} secondary={following.username} />
              </ListItem>
            )) : <Typography>Not following anyone</Typography>}
          </List>
        </TabPanel>
      </DialogContent>
    </Dialog>
  );
};

export default UserProfilePage;