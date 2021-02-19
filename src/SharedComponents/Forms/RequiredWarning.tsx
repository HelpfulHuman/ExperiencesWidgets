import { h } from "preact";

interface IRequiredWarningProps {
    message: string;
}

export const RequiredWarning = ({ message }: IRequiredWarningProps) => {
    return (
        <div className="FormField-RequredWarning">
            <span className="">*</span>
            <span> - </span>
            <span>{message}</span>
        </div>
    );
};