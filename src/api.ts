export interface Comment {
  username: string;
  description: string;
}

export interface Post {
  id: number;
  username: string;
  description: string;
  likes: string[];
  comments: Comment[];
  image?: string;
  tags?: string[];
}

export interface User {
  id: number;
  name: string;
  username: string;
  phone: string;
  email: string;
  bio?: string;
  image?: string;
  followers?: string[];
  following?: string[];
}

const baseUrl = 'http://localhost:3000';

export const getPosts = async (): Promise<Post[]> => {
  const res = await fetch(`${baseUrl}/posts`);
  if (!res.ok) throw new Error('Error fetching posts');
  return res.json();
};

export const likePost = async ({ postId, username }: { postId: number; username: string }) => {
  const res = await fetch(`${baseUrl}/posts/${postId}/like`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  });
  if (!res.ok) throw new Error('Failed to like');
  return res.json();
};

export const unlikePost = async ({ postId, username }: { postId: number; username: string }) => {
  const res = await fetch(`${baseUrl}/posts/${postId}/like`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  });
  if (!res.ok) throw new Error('Failed to unlike');
  return res.json();
};

export const addComment = async ({ postId, username, description }: { postId: number; username: string; description: string }) => {
  const res = await fetch(`${baseUrl}/posts/${postId}/comment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, description }),
  });
  if (!res.ok) throw new Error('Failed to add comment');
  return res.json();
};

export const searchUsers = async (query: string): Promise<User[]> => {
  const res = await fetch(`${baseUrl}/users`);
  if (!res.ok) throw new Error('Failed to fetch users');
  const all: User[] = await res.json();
  return all.filter(u => u.username.includes(query) || u.name.includes(query));
};

export const getUser = async (username: string): Promise<User> => {
  const res = await fetch(`${baseUrl}/users/findByUsername/${username}`);
  if (!res.ok) throw new Error('User not found');
  return res.json();
};

export const followUserApi = async ({ currentUser, username }: { currentUser: string; username: string }) => {
  const res = await fetch(`${baseUrl}/users/follow`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentUser, username }),
  });
  if (!res.ok) throw new Error('Failed to follow');
  return res.json();
};

export const unfollowUserApi = async ({ currentUser, username }: { currentUser: string; username: string }) => {
  const res = await fetch(`${baseUrl}/users/unfollow`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentUser, username }),
  });
  if (!res.ok) throw new Error('Failed to unfollow');
  return res.json();
};
