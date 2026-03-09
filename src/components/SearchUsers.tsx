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
    <Box sx={{ p: 2 }}>
      <TextField
        fullWidth
        label="Search users"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        sx={{ mb: 2 }}
      />
      {isLoading && <Typography>Loading...</Typography>}
      {users && users.length > 0 && (
        <List>
          {users.map((user) => (
            <ListItem key={user.id} onClick={() => onUserClick && onUserClick(user.username)}>
              <ListItemAvatar>
                <Avatar src={user.image ? `http://localhost:3000${user.image}` : undefined}>
                  {user.name[0]}
                </Avatar>
              </ListItemAvatar>
              <ListItemText primary={user.name} secondary={user.username} />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};

export default SearchUsers;