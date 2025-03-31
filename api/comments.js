// This is a serverless function that will run on Vercel
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client (you would set these in Vercel environment variables)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    if (req.method === 'GET') {
        // Fetch all comments
        try {
            const { data, error } = await supabase
                .from('comments')
                .select('*')
                .order('timestamp', { ascending: true });
                
            if (error) throw error;
            
            // Group comments by frameId
            const commentsByFrame = {};
            data.forEach(comment => {
                if (!commentsByFrame[comment.frameId]) {
                    commentsByFrame[comment.frameId] = [];
                }
                commentsByFrame[comment.frameId].push(comment);
            });
            
            res.status(200).json(commentsByFrame);
        } catch (error) {
            console.error('Error fetching comments:', error);
            res.status(500).json({ error: 'Failed to fetch comments' });
        }
    } else if (req.method === 'POST') {
        // Add a new comment
        try {
            const { frameId, text, timestamp } = req.body;
            
            if (!frameId || !text) {
                return res.status(400).json({ error: 'Missing required fields' });
            }
            
            const { data, error } = await supabase
                .from('comments')
                .insert([{ frameId, text, timestamp }])
                .select();
                
            if (error) throw error;
            
            res.status(201).json(data[0]);
        } catch (error) {
            console.error('Error adding comment:', error);
            res.status(500).json({ error: 'Failed to add comment' });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
} 