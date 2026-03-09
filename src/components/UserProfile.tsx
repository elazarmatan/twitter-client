import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Avatar,
  Button,
  Dialog,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  CircularProgress,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

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

interface UserProfileProps {
  username: string;
  currentUser?: string;
  onFollowChange?: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ username, currentUser, onFollowChange }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followersList, setFollowersList] = useState<User[]>([]);
  const [followingList, setFollowingList] = useState<User[]>([]);
  const [openFollowers, setOpenFollowers] = useState(false);
  const [openFollowing, setOpenFollowing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(`http://localhost:3000/users/findByUsername/${username}`);
        if (!response.ok) {
          throw new Error('Failed to fetch user');
        }
        const userData: User = await response.json();
        setUser(userData);
        
        // Check if current user is following this user
        if (currentUser && userData.followers?.includes(currentUser)) {
          setIsFollowing(true);
        }

        // Fetch followers details
        if (userData.followers && userData.followers.length > 0) {
          const followersData = await Promise.all(
            userData.followers.map(async (followerUsername) => {
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
          );
          setFollowersList(followersData.filter(f => f !== null));
        }

        // Fetch following details
        if (userData.following && userData.following.length > 0) {
          const followingData = await Promise.all(
            userData.following.map(async (followingUsername) => {
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
          );
          setFollowingList(followingData.filter(f => f !== null));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [username, currentUser]);

  const handleFollowClick = async () => {
    if (!currentUser) {
      return;
    }

    setFollowLoading(true);
    try {
      const endpoint = isFollowing ? 'unfollow' : 'follow';
      const response = await fetch(`http://localhost:3000/users/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentUser,
          username,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${endpoint} user`);
      }

      setIsFollowing(!isFollowing);
      if (onFollowChange) {
        onFollowChange();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  if (error || !user) {
    return (
      <Card sx={{ mb: 2, backgroundColor: '#ffebee' }}>
        <CardContent>
          <Typography color="error">{error || 'User not found'}</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Avatar
              src={user.image ? `http://localhost:3000${user.image}` : undefined}
              sx={{ width: 80, height: 80 }}
            >
              {user.name[0].toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6">{user.name}</Typography>
              <Typography variant="body2" color="textSecondary">
                {user.username}
              </Typography>
              <Typography variant="body2">{user.bio}</Typography>
              <Typography variant="caption" color="textSecondary">
                📧 {user.email} | 📱 {user.phone}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setOpenFollowers(true)}
            >
              Followers: {user.followers?.length || 0}
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setOpenFollowing(true)}
            >
              Following: {user.following?.length || 0}
            </Button>
            {currentUser && currentUser !== user.username && (
              <Button
                variant={isFollowing ? 'outlined' : 'contained'}
                size="small"
                onClick={handleFollowClick}
                disabled={followLoading}
                color={isFollowing ? 'error' : 'primary'}
              >
                {isFollowing ? 'Unfollow' : 'Follow'}
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Followers Dialog */}
      <Dialog open={openFollowers} onClose={() => setOpenFollowers(false)} maxWidth="sm" fullWidth>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Followers</Typography>
          <Button onClick={() => setOpenFollowers(false)}>
            <CloseIcon />
          </Button>
        </Box>
        <List>
          {followersList.length > 0 ? (
            followersList.filter(follower => follower && follower.name).map(follower => (
              <ListItem key={follower.id}>
                <ListItemAvatar>
                  <Avatar src={follower.image ? `http://localhost:3000${follower.image}` : undefined}>
                    {follower.name ? follower.name[0].toUpperCase() : '?'}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={follower.name || 'Unknown'}
                  secondary={follower.username}
                />
              </ListItem>
            ))
          ) : (
            <ListItem>
              <ListItemText primary="No followers yet" />
            </ListItem>
          )}
        </List>
      </Dialog>

      {/* Following Dialog */}
      <Dialog open={openFollowing} onClose={() => setOpenFollowing(false)} maxWidth="sm" fullWidth>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Following</Typography>
          <Button onClick={() => setOpenFollowing(false)}>
            <CloseIcon />
          </Button>
        </Box>
        <List>
          {followingList.length > 0 ? (
            followingList.filter(following => following && following.name).map(following => (
              <ListItem key={following.id}>
                <ListItemAvatar>
                  <Avatar src={following.image ? `http://localhost:3000${following.image}` : undefined}>
                    {following.name ? following.name[0].toUpperCase() : '?'}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={following.name || 'Unknown'}
                  secondary={following.username}
                />
              </ListItem>
            ))
          ) : (
            <ListItem>
              <ListItemText primary="Not following anyone yet" />
            </ListItem>
          )}
        </List>
      </Dialog>
    </>
  );
};

export default UserProfile;
