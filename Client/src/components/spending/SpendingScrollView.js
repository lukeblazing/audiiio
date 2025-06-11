import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

function SpendingCard({ entry, onDelete }) {
  const theme = useTheme();
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        background: theme.palette.background.paper,
        boxShadow: '0 3px 14px rgba(0,0,0,0.05)',
        mb: 1,
      }}
    >
      <CardContent sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 18 }}>
            ${entry.amount}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
            {entry.reason}
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: 'text.secondary', mr: 2 }}>
          {entry.date}
        </Typography>
        <IconButton size="small" onClick={onDelete}>
          <DeleteIcon fontSize="small" />
        </IconButton>
      </CardContent>
    </Card>
  );
}

function getToday() {
  return new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function SpendingInput() {
  const [form, setForm] = useState({
    amount: '',
    reason: '',
  });
  const [spendingList, setSpendingList] = useState([]);
  const [loading, setLoading] = useState(false);

  const totalSpend = spendingList.reduce((sum, entry) => sum + Number(entry.amount), 0);

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const addSpending = async () => {
    if (!form.amount || !form.reason) return;
    const newList = [
      {
        id: Date.now(),
        amount: parseFloat(form.amount),
        reason: form.reason,
        date: getToday(),
      },
      ...spendingList,
    ];
    setSpendingList(newList);
    setForm({ amount: '', reason: '' });
    setLoading(true);
    // send to db
    setLoading(false);
  };

  const deleteSpending = async (id) => {
    const newList = spendingList.filter((e) => e.id !== id);
    setSpendingList(newList);
    setLoading(true);
    // send to db
    setLoading(false);
  };

  return (
    <Box sx={{ maxWidth: 440, mx: 'auto', p: { xs: 2, sm: 4 } }}>
      {/* --- Total Banner --- */}
      <Box sx={{
        mb: 3,
        p: 2,
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
        borderRadius: 3,
        textAlign: 'center',
      }}>
        <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: 1 }}>
          ${totalSpend.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </Typography>
        <Typography sx={{ fontWeight: 600, opacity: 0.8 }}>
          Total spent this month
        </Typography>
      </Box>

      {/* --- Entry Form --- */}
      <Card elevation={0} sx={{ borderRadius: 4, mb: 3, p: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              name="reason"
              value={form.reason}
              onChange={handleInputChange}
              placeholder="Reason"
              type="text"
              inputProps={{
                maxLength: 80,
                style: {
                  fontSize: 32,
                  textAlign: 'center',
                  fontWeight: 600,
                  letterSpacing: 0.5
                }
              }}
              fullWidth
              variant="outlined"
              sx={{ mb: 1 }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="amount"
              value={form.amount}
              onChange={handleInputChange}
              placeholder="Amount"
              type="number"
              inputProps={{
                min: 0,
                step: 0.01,
                style: {
                  fontSize: 32,
                  textAlign: 'center',
                  fontWeight: 700,
                  letterSpacing: 1
                }
              }}
              fullWidth
              variant="outlined"
              sx={{ fontWeight: 800, mb: 1 }}
            />
          </Grid>

          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              sx={{ fontWeight: 800, fontSize: 22, height: 56, borderRadius: 3, mt: 1 }}
              onClick={addSpending}
              disabled={loading || !form.amount || !form.reason}
            >
              Add Spend
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* --- Spend List --- */}
      <Box>
        {spendingList.length === 0 ? (
          <Typography
            variant="body2"
            align="center"
            color="text.secondary"
            sx={{ opacity: 0.7, fontWeight: 500 }}
          >
            No spending yet. Add your first!
          </Typography>
        ) : (
          spendingList.map((entry) => (
            <SpendingCard
              key={entry.id}
              entry={entry}
              onDelete={() => deleteSpending(entry.id)}
            />
          ))
        )}
      </Box>
    </Box>
  );
}
