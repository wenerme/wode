import type { MouseEventHandler } from 'react';
import React from 'react';
import styled from 'styled-components';

class AutoScalingText extends React.Component<React.PropsWithChildren<{}>> {
  state = {
    scale: 1,
  };

  node?: HTMLElement | null;

  componentDidUpdate() {
    const { scale } = this.state;

    const node = this.node;
    if (!node) {
      return;
    }
    const parentNode = node.parentNode as HTMLElement;

    const availableWidth = parentNode?.offsetWidth;
    const actualWidth = node.offsetWidth;
    const actualScale = availableWidth / actualWidth;

    if (scale === actualScale) return;

    if (actualScale < 1) {
      this.setState({ scale: actualScale });
    } else if (scale < 1) {
      this.setState({ scale: 1 });
    }
  }

  render() {
    const { scale } = this.state;

    return (
      <div
        className="auto-scaling-text"
        style={{ transform: `scale(${scale},${scale})` }}
        ref={(node) => (this.node = node)}
      >
        {this.props.children}
      </div>
    );
  }
}

class CalculatorDisplay extends React.Component<any> {
  render() {
    const { value, ...props } = this.props;

    const language = (typeof navigator !== 'undefined' && navigator.language) || 'en-US';
    let formattedValue = parseFloat(value).toLocaleString(language, {
      useGrouping: true,
      maximumFractionDigits: 6,
    });

    // Add back missing .0 in e.g. 12.0
    const match = value.match(/\.\d*?(0*)$/);

    if (match) formattedValue += /[1-9]/.test(match[0]) ? match[1] : match[0];

    return (
      <div {...props} className="calculator-display">
        <AutoScalingText>{formattedValue}</AutoScalingText>
      </div>
    );
  }
}

class CalculatorKey extends React.Component<{
  onPress?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
  children?: React.ReactNode;
}> {
  render() {
    const { onPress, className, ...props } = this.props;
    return <button onClick={onPress} className={`calculator-key ${className}`} {...props} />;
    // not sure why need react-point to handle touch end
    // return (
    //   <PointTarget onPoint={onPress}>
    //     <button className={`calculator-key ${className}`} {...props} />
    //   </PointTarget>
    // );
  }
}

const CalculatorOperations: Record<string, (a: number, b: number) => number> = {
  '/': (prevValue, nextValue) => prevValue / nextValue,
  '*': (prevValue, nextValue) => prevValue * nextValue,
  '+': (prevValue, nextValue) => prevValue + nextValue,
  '-': (prevValue, nextValue) => prevValue - nextValue,
  '=': (prevValue, nextValue) => nextValue,
};

export class Calculator extends React.Component {
  state = {
    value: null,
    displayValue: '0',
    operator: null,
    waitingForOperand: false,
  };

  clearAll() {
    this.setState({
      value: null,
      displayValue: '0',
      operator: null,
      waitingForOperand: false,
    });
  }

  clearDisplay() {
    this.setState({
      displayValue: '0',
    });
  }

  clearLastChar() {
    const { displayValue } = this.state;

    this.setState({
      displayValue: displayValue.substring(0, displayValue.length - 1) || '0',
    });
  }

  toggleSign() {
    const { displayValue } = this.state;
    const newValue = parseFloat(displayValue) * -1;

    this.setState({
      displayValue: String(newValue),
    });
  }

  inputPercent() {
    const { displayValue } = this.state;
    const currentValue = parseFloat(displayValue);

    if (currentValue === 0) return;

    const fixedDigits = displayValue.replace(/^-?\d*\.?/, '');
    const newValue = parseFloat(displayValue) / 100;

    this.setState({
      displayValue: String(newValue.toFixed(fixedDigits.length + 2)),
    });
  }

  inputDot() {
    const { displayValue } = this.state;

    if (!displayValue.includes('.')) {
      this.setState({
        displayValue: displayValue + '.',
        waitingForOperand: false,
      });
    }
  }

  inputDigit(digit: number) {
    const { displayValue, waitingForOperand } = this.state;

    if (waitingForOperand) {
      this.setState({
        displayValue: String(digit),
        waitingForOperand: false,
      });
    } else {
      this.setState({
        displayValue: displayValue === '0' ? String(digit) : displayValue + digit,
      });
    }
  }

  performOperation(nextOperator: string) {
    const { value, displayValue, operator } = this.state;
    const inputValue = parseFloat(displayValue);

    if (value == null) {
      this.setState({
        value: inputValue,
      });
    } else if (operator) {
      const currentValue = value || 0;
      const newValue = CalculatorOperations[operator](currentValue, inputValue);

      this.setState({
        value: newValue,
        displayValue: String(newValue),
      });
    }

    this.setState({
      waitingForOperand: true,
      operator: nextOperator,
    });
  }

  handleKeyDown = (event: KeyboardEvent) => {
    let { key } = event;

    if (key === 'Enter') key = '=';

    if (/\d/.test(key)) {
      event.preventDefault();
      this.inputDigit(parseInt(key, 10));
    } else if (key in CalculatorOperations) {
      event.preventDefault();
      this.performOperation(key);
    } else if (key === '.') {
      event.preventDefault();
      this.inputDot();
    } else if (key === '%') {
      event.preventDefault();
      this.inputPercent();
    } else if (key === 'Backspace') {
      event.preventDefault();
      this.clearLastChar();
    } else if (key === 'Clear') {
      event.preventDefault();

      if (this.state.displayValue !== '0') {
        this.clearDisplay();
      } else {
        this.clearAll();
      }
    }
  };

  componentDidMount() {
    document.addEventListener('keydown', this.handleKeyDown);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  render() {
    const { displayValue } = this.state;

    const clearDisplay = displayValue !== '0';
    const clearText = clearDisplay ? 'C' : 'AC';

    return (
      <Style>
        <div className="calculator">
          <CalculatorDisplay value={displayValue} />
          <div className="calculator-keypad">
            <div className="input-keys">
              <div className="function-keys">
                <CalculatorKey
                  className="key-clear"
                  onPress={() => (clearDisplay ? this.clearDisplay() : this.clearAll())}
                >
                  {clearText}
                </CalculatorKey>
                <CalculatorKey className="key-sign" onPress={() => this.toggleSign()}>
                  ±
                </CalculatorKey>
                <CalculatorKey onPress={() => this.inputPercent()}>%</CalculatorKey>
              </div>
              <div className="digit-keys">
                <CalculatorKey className="key-0" onPress={() => this.inputDigit(0)}>
                  0
                </CalculatorKey>
                <CalculatorKey className="key-dot" onPress={() => this.inputDot()}>
                  ●
                </CalculatorKey>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((v) => (
                  <CalculatorKey className={`key-${v}`} key={v} onPress={() => this.inputDigit(v)}>
                    {v}
                  </CalculatorKey>
                ))}
              </div>
            </div>
            <div className="operator-keys">
              <CalculatorKey className="key-divide" onPress={() => this.performOperation('/')}>
                ÷
              </CalculatorKey>
              <CalculatorKey className="key-multiply" onPress={() => this.performOperation('*')}>
                ×
              </CalculatorKey>
              <CalculatorKey className="key-subtract" onPress={() => this.performOperation('-')}>
                −
              </CalculatorKey>
              <CalculatorKey className="key-add" onPress={() => this.performOperation('+')}>
                +
              </CalculatorKey>
              <CalculatorKey className="key-equals" onPress={() => this.performOperation('=')}>
                =
              </CalculatorKey>
            </div>
          </div>
        </div>
      </Style>
    );
  }
}

const Style = styled.div`
  width: 320px;
  height: 520px;
  position: relative;

  .calculator {
    width: 100%;
    height: 100%;
    background: black;

    display: flex;
    flex-direction: column;

    font: 100 14px 'Roboto';
    font-family: 'Roboto', Arial, Helvetica, sans-serif;

    button {
      display: block;
      background: none;
      border: none;
      padding: 0;
      font-family: inherit;
      user-select: none;
      cursor: pointer;
      outline: none;

      -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
    }

    button:active {
      box-shadow: inset 0px 0px 80px 0px rgba(0, 0, 0, 0.25);
    }
  }

  .calculator-display {
    color: white;
    background: #1c191c;
    line-height: 130px;
    font-size: 6em;

    flex: 1;
  }

  .auto-scaling-text {
    display: inline-block;
  }

  .calculator-display .auto-scaling-text {
    padding: 0 30px;
    position: absolute;
    right: 0;
    transform-origin: right;
  }

  .calculator-keypad {
    height: 400px;

    display: flex;
  }

  .calculator .input-keys {
    width: 240px;
  }

  .calculator .function-keys {
    display: flex;
  }

  .calculator .digit-keys {
    background: #e0e0e7;

    display: flex;
    flex-direction: row;
    flex-wrap: wrap-reverse;
  }

  .calculator-key {
    width: 80px;
    height: 80px;
    border-top: 1px solid #777;
    border-right: 1px solid #666;
    text-align: center;
    line-height: 80px;
  }

  .calculator .function-keys .calculator-key {
    font-size: 2em;
  }

  .calculator .function-keys .key-multiply {
    line-height: 50px;
  }

  .calculator .digit-keys .calculator-key {
    font-size: 2.25em;
  }

  .calculator .digit-keys .key-0 {
    width: 160px;
    text-align: left;
    padding-left: 32px;
  }

  .calculator .digit-keys .key-dot {
    padding-top: 1em;
    font-size: 0.75em;
  }

  .calculator .operator-keys .calculator-key {
    color: white;
    border-right: 0;
    font-size: 3em;
  }

  .calculator .function-keys {
    background: linear-gradient(to bottom, rgba(202, 202, 204, 1) 0%, rgba(196, 194, 204, 1) 100%);
  }

  .calculator .operator-keys {
    background: linear-gradient(to bottom, rgba(252, 156, 23, 1) 0%, rgba(247, 126, 27, 1) 100%);
  }
`;
