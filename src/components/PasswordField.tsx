import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

type PasswordFieldProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  inputClassName?: string;
};

export default function PasswordField({ inputClassName, className, ...props }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={`relative ${className || ""}`}>
      <input
        {...props}
        type={visible ? "text" : "password"}
        className={`${inputClassName || ""} pr-11`}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-berry/55 hover:text-primary transition-colors"
        aria-label={visible ? "Ocultar senha" : "Exibir senha"}
        title={visible ? "Ocultar senha" : "Exibir senha"}
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
