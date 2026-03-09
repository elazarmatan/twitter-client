import React, { useState } from 'react';
import { Box, TextField, List, ListItem, ListItemAvatar, ListItemText, Avatar, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { searchUsers } from '../api';

interface SearchUsersProps {
  onUserClick?: (username: string) => void;
}

const SearchUsers: React.FC<SearchUsersProps> = ({ onUserClick }) => {
  const [query, setQuery] = useState('');
  const { data: users, isLoading } = useQuery({
    queryKey: ['searchUsers', query],
    queryFn: () => searchUsers(query),
    enabled: query.length > 0,
  });

  return (
    <Box sx={{ pt: 1 }}>
      <TextField
        fullWidth
        placeholder="Search users"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
        InputProps={{
          sx: {
            color: '#e7e9ea',
            borderRadius: 20,
            bgcolor: '#202327',
            '& fieldset': { borderColor: 'transparent' },
            '&:hover fieldset': { borderColor: '#536471' },
            '&.Mui-focused fieldset': { borderColor: '#1d9bf0' },
          },
        }}
        inputProps={{ style: { color: '#e7e9ea' } }}
        sx={{ mb: 2 }}
      />
      {isLoading && (
        <Typography sx={{ color: '#71767b', textAlign: 'center', py: 2 }}>
          Searching...
        </Typography>
      )}
      {users && users.length > 0 && (
        <List disablePadding>
          {users.map((user) => (
            <ListItem
              key={user.id}
              onClick={() => onUserClick && onUserClick(user.username)}
              sx={{
                cursor: 'pointer',
                borderRadius: 2,
                '&:hover': { bgcolor: 'rgba(239,243,244,0.05)' },
                px: 1,
                py: 1,
              }}
            >
              <ListItemAvatar>
                <Avatar
                  src={user.image ? `http://localhost:3000${user.image}` : undefined}
                  sx={{ border: '1px solid #2f3336' }}
                >
                  {user.name[0]}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Typography fontWeight={700} sx={{ color: '#e7e9ea' }}>
                    {user.name}
                  </Typography>
                }
                secondary={
                  <Typography variant="caption" sx={{ color: '#71767b' }}>
                    @{user.username}
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </List>
      )}
      {query.length > 0 && !isLoading && users?.length === 0 && (
        <Typography sx={{ color: '#71767b', textAlign: 'center', py: 4 }}>
          No users found for "{query}"
        </Typography>
      )}
    </Box>
  );
};

export default SearchUsers;
