/** @jsx h */
import { h, FunctionComponent } from "preact";
import { Button } from "../Button";
import { CloseIcon } from "../Icon/CloseIcon";
import { TextStyle } from "../TextStyle";
import "./Modal.scss";

export type ModalProps = {
  /**Whether the modal is open or closed. */
  isOpen: boolean;
  /**Title text in modal. */
  title: string;
  /**Content text in modal. */
  content: string;
  /**Button text for confirming modal message. */
  confirmButtonText: string;
  /**Callback for clicking modal confirm button. */
  onClickConfirmButton: () => void;
  /**Button text for cancelling modal message. */
  cancelButtonText: string;
  /**Callback for clicking modal cancel button */
  onClickCancelButton: () => void;
};

export const Modal: FunctionComponent<ModalProps> = ({
  cancelButtonText,
  onClickCancelButton,
  confirmButtonText,
  onClickConfirmButton,
  content,
  title,
  isOpen,
}) => {
  const modalContainerClassNames = ["FullPage__Modal__Container"];

  if (isOpen) {
    modalContainerClassNames.push("FullPage__Modal__Container--Open");
  }
  return (
    <div className={modalContainerClassNames.join(" ")} role="FullPage__Modal">
      <div className="FullPage__Modal">
        <div className="FullPage__Modal__Title-Row">
          <TextStyle variant="display2" text={title} />
          <button
            className="FullPage__Modal__Close"
            onClick={onClickCancelButton}
            role="cancel"
          >
            <CloseIcon height={30} color="#888888" />
          </button>
        </div>

        <div className="FullPage__Modal__Content">
          <TextStyle variant="body1" text={content} />
        </div>

        <div className="FullPage__Modal__Buttons">
          <Button
            text={cancelButtonText}
            onClick={onClickCancelButton}
            color="transparent"
          />
          <Button
            text={confirmButtonText}
            onClick={onClickConfirmButton}
            color="danger"
          />
        </div>
      </div>
    </div>
  );
};