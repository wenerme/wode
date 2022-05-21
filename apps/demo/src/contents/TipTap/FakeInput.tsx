import React, { HTMLProps, KeyboardEventHandler } from 'react';
import styled from 'styled-components';
import { MdAdd, MdRemove } from 'react-icons/md';

export interface FakeInputProps {
  value?: string;
  onChange?: (v: string) => void;
  pattern?: RegExp;
  placeholder?: React.ReactNode;
  step?: number;
  min?: number;
  max?: number;
  options?: Array<{ label?: React.ReactNode; value: string }>;
}

const Container = styled.div`
  display: inline-flex;
  border: 1px solid rgb(218, 220, 224);
  border-radius: 0.2rem;
  position: relative;

  button:not(.__input) {
    width: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  button:hover {
    background-color: #f1f3f4;
  }

  .__input {
    border: 1px solid rgb(218, 220, 224);
    border-top: none;
    border-bottom: none;
    width: 3rem;

    &:focus {
      color: #1a73e8;
      background-color: #e8f0fe;
    }
  }

  .__pop {
    display: none;
    position: absolute;
    z-index: 10;
    top: 100%;
    left: 50%;
    padding: 0.2rem;
    border: 1px rgb(218, 220, 224) solid;
    border-radius: 0.2rem;
    width: 5rem;
    box-sizing: border-box;
    background-color: white;
    transform: translateX(-50%);

    flex-flow: column;
    gap: 0.2rem;

    .__option {
      padding: 0.1rem;

      &:hover {
        background-color: #f1f3f4;
      }
    }
  }

  &:focus-within .__pop,
  &:hover .__pop {
    display: flex;
  }
`;

export const FakeInput: React.FC<FakeInputProps & Omit<HTMLProps<HTMLDivElement>, 'onChange'>> = (props) => {
  const { value, min, max, options = [], onChange, pattern, placeholder, step = 1, ...rest } = props;
  const [edit, setEdit] = React.useState(value ?? '');
  React.useLayoutEffect(() => {
    let next = value ?? '';
    if (next !== edit) {
      setEdit(next);
    }
  }, [value]);

  const doChange = (v?: string) => {
    onChange?.(v ?? edit);
  };
  const setValue = (v: string | number, change?: boolean) => {
    if (pattern && !pattern.test(String(v))) {
      return;
    }
    if (min !== undefined || max !== undefined) {
      v = parseFloat(String(v));
    }
    if (Number.isNaN(v)) {
      v = 0;
    }
    if (min !== undefined) {
      v = v < min ? min : v;
    }
    if (max !== undefined) {
      v = v > max ? max : v;
    }

    if (change) {
      doChange(String(v));
    }
    setEdit(String(v));
  };

  let frac = 0;
  if (step >= 1) {
  } else if (step >= 0.1) {
    frac = 1;
  } else if (step >= 0.01) {
    frac = 2;
  }
  const increase = () => {
    setValue((parseFloat(edit || '0') - step).toFixed(frac), true);
  };
  const decrease = () => {
    setValue((parseFloat(edit || '0') + step).toFixed(frac), true);
  };
  const handleInputKey: KeyboardEventHandler<any> = (e) => {
    switch (e.key) {
      case 'Backspace':
        setEdit(String(edit).substring(0, String(edit).length - 1));
        break;
      case 'Enter':
        doChange();
        break;
      case 'Esc':
      case 'Escape':
        setEdit(value ?? '');
        break;
      default:
        if (e.key.length === 1) {
          let next = String(edit) + e.key;
          setEdit(next);
        }
    }
  };
  return (
    <Container {...rest}>
      <button type={'button'} onClick={increase}>
        <MdRemove />
      </button>
      <button type={'button'} onKeyUp={handleInputKey} onBlur={() => setValue(edit, true)} className={'__input'}>
        {edit || placeholder}
      </button>
      <button type={'button'} onClick={decrease}>
        <MdAdd />
      </button>
      {options?.length && (
        <div className={'__pop rounded shadow'}>
          {options.map((v, i) => (
            <div
              key={i}
              className={'__option'}
              onClick={() => {
                setEdit(v.value);
                onChange?.(v.value);
              }}
            >
              {v.label || v.value}
            </div>
          ))}
        </div>
      )}
    </Container>
  );
};
