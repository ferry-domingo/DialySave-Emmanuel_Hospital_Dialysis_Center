import Modal from "./Modal";
import Button from "./Button";

const ConfirmDialog = ({
  open,
  title,
  message,
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
    >
      <p className="mb-6">{message}</p>

      <div className="flex justify-end gap-2">
        <Button
          className="bg-gray-500 hover:bg-gray-600"
          onClick={onCancel}
        >
          Cancel
        </Button>

        <Button
          className="bg-red-600 hover:bg-red-700"
          onClick={onConfirm}
        >
          Delete
        </Button>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;