import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Fade
} from '@mui/material';

const ConfirmDialog = ({
  open,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  title = 'Confirm Action'
}) => {
  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      onConfirm();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      onKeyDown={handleKeyDown}
      TransitionComponent={Fade}
      PaperProps={{
        sx: {
          borderRadius: 2,
          minWidth: '300px'
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button 
          onClick={onCancel}
          color="inherit"
          variant="outlined"
          sx={{ textTransform: 'none' }}
        >
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          color="error"
          variant="contained"
          autoFocus
          sx={{ 
            textTransform: 'none',
            '&:hover': {
              backgroundColor: 'error.dark'
            }
          }}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;