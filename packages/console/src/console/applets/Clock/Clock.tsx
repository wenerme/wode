import React, { ComponentPropsWithoutRef, useEffect, useReducer } from 'react';
import styled from '@emotion/styled';
import { clsx } from 'clsx';

// noinspection CssUnresolvedCustomProperty
const Container = styled.div`
  /*========== Colors ==========*/
  --hue-color: 240;

  --first-color: hsl(var(--hue-color), 53%, 49%);
  --title-color: hsl(var(--hue-color), 53%, 15%);
  --text-color: hsl(var(--hue-color), 12%, 35%);
  --text-color-light: hsl(var(--hue-color), 12%, 65%);
  --white-color: #fff;
  --body-color: hsl(var(--hue-color), 24%, 94%);

  /*========== Font and typography ==========*/
  --body-font: 'Poppins', sans-serif;
  --biggest-font-size: 3rem;
  --small-font-size: 0.813rem;
  --smaller-font-size: 0.75rem;
  --tiny-font-size: 0.625rem;

  /*========== Font weight ==========*/
  --font-medium: 500;

  /*========== Margenes Bottom ==========*/
  --mb-0-25: 0.25rem;
  --mb-1: 1rem;
  --mb-1-5: 1.5rem;
  --mb-2-5: 2.5rem;

  /*========== z index ==========*/
  --z-normal: 1;
  --z-tooltip: 10;

  /*========== Button Dark/Light ==========*/

  .clock__theme {
    position: absolute;
    top: -1rem;
    right: -1rem;
    display: flex;
    padding: 0.25rem;
    border-radius: 50%;
    box-shadow:
      inset -1px -1px 1px hsla(var(--hue-color), 0%, 100%, 1),
      inset 1px 1px 1px hsla(var(--hue-color), 30%, 86%, 1);
    color: var(--first-color);
    cursor: pointer;
    transition: 0.4s; // For dark mode animation
  }

  /*========== Box shadow Dark theme ==========*/

  .dark-theme .clock__circle {
    box-shadow:
      6px 6px 16px hsla(var(--hue-color), 8%, 12%, 1),
      -6px -6px 16px hsla(var(--hue-color), 8%, 20%, 1),
      inset -6px -6px 16px hsla(var(--hue-color), 8%, 20%, 1),
      inset 6px 6px 12px hsla(var(--hue-color), 8%, 12%, 1);
  }

  .dark-theme .clock__theme {
    box-shadow:
      inset -1px -1px 1px hsla(var(--hue-color), 8%, 20%, 1),
      inset 1px 1px 1px hsla(var(--hue-color), 8%, 12%, 1);
  }

  /*=============== REUSABLE CSS CLASSES ===============*/

  .container {
    max-width: 968px;
    margin-left: var(--mb-1);
    margin-right: var(--mb-1);
  }

  .grid {
    display: grid;
  }

  /*=============== CLOCK ===============*/

  .clock__container {
    grid-template-rows: 1fr max-content;
  }

  .clock__circle {
    position: relative;
    width: 200px;
    height: 200px;
    box-shadow:
      -6px -6px 16px var(--white-color),
      6px 6px 16px hsla(var(--hue-color), 30%, 86%, 1),
      inset 6px 6px 16px hsla(var(--hue-color), 30%, 86%, 1),
      inset -6px -6px 16px var(--white-color);
    border-radius: 50%;
    justify-self: center;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: 0.4s; // For dark mode animation
  }

  .clock__content {
    align-self: center;
    row-gap: 3.5rem;
  }

  .clock__twelve,
  .clock__three,
  .clock__six,
  .clock__nine {
    position: absolute;
    width: 1rem;
    height: 1px;
    background-color: var(--text-color-light);
  }

  .clock__twelve,
  .clock__six {
    transform: translateX(-50%) rotate(90deg);
  }

  .clock__twelve {
    top: 1.25rem;
    left: 50%;
  }

  .clock__three {
    top: 50%;
    right: 0.75rem;
  }

  .clock__six {
    bottom: 1.25rem;
    left: 50%;
  }

  .clock__nine {
    left: 0.75rem;
    top: 50%;
  }

  .clock__rounder {
    width: 0.75rem;
    height: 0.75rem;
    background-color: var(--first-color);
    border-radius: 50%;
    border: 2px solid var(--body-color);
    z-index: var(--z-tooltip);
  }

  .clock__hour,
  .clock__minutes,
  .clock__seconds {
    position: absolute;
    display: flex;
    justify-content: center;
  }

  .clock__hour {
    width: 105px;
    height: 105px;
  }

  .clock__hour::before {
    content: '';
    position: absolute;
    background-color: var(--text-color);
    width: 0.25rem;
    height: 3rem;
    border-radius: 0.75rem;
    z-index: var(--z-normal);
  }

  .clock__minutes {
    width: 136px;
    height: 136px;
  }

  .clock__minutes::before {
    content: '';
    position: absolute;
    background-color: var(--text-color);
    width: 0.25rem;
    height: 4rem;
    border-radius: 0.75rem;
    z-index: var(--z-normal);
  }

  .clock__seconds {
    width: 130px;
    height: 130px;
  }

  .clock__seconds::before {
    content: '';
    position: absolute;
    background-color: var(--first-color);
    width: 0.125rem;
    height: 5rem;
    border-radius: 0.75rem;
    z-index: var(--z-normal);
  }

  .clock__logo {
    width: max-content;
    justify-self: center;
    margin-bottom: var(--mb-2-5);
    font-size: var(--smaller-font-size);
    font-weight: var(--font-medium);
    color: var(--text-color-light);
    transition: 0.3s;
  }

  .clock__logo:hover {
    color: var(--first-color);
  }

  .clock__text {
    display: flex;
    justify-content: center;
  }

  .clock__text-hour,
  .clock__text-minutes {
    font-size: var(--biggest-font-size);
    font-weight: var(--font-medium);
    color: var(--title-color);
  }

  .clock__text-ampm {
    font-size: var(--tiny-font-size);
    color: var(--title-color);
    font-weight: var(--font-medium);
    margin-left: var(--mb-0-25);
  }

  .clock__date {
    font-size: var(--small-font-size);
    font-weight: var(--font-medium);
  }
`;

export const Clock: React.FC<ComponentPropsWithoutRef<'div'>> = ({ className, children, ...props }) => {
  // src https://www.cssscript.com/modern-clock-ui/

  let date = new Date();

  let h = date.getHours();
  let m = date.getMinutes();
  let s = date.getSeconds();
  let mAng = m * 6;
  let sAng = s * 6;
  let hAng = h * 30 + mAng / 12;

  let textHour: string | number = '',
    textMinutes: string | number = '',
    textAmPm: string | number = '';

  const clockText = () => {
    let hh: string | number = h,
      ampm,
      mm: string | number = m;

    // We change the hours from 24 to 12 hours and establish whether it is AM or PM
    if (hh >= 12) {
      hh = hh - 12;
      ampm = 'PM';
    } else {
      ampm = 'AM';
    }

    // We detect when it's 0 AM and transform to 12 AM
    if (hh == 0) {
      hh = 12;
    }

    // Show a zero before hours
    if (hh < 10) {
      hh = `0${hh}`;
    }

    // Show time
    textHour = `${hh}:`;

    // Show a zero before the minutes
    if (mm < 10) {
      mm = `0${mm}`;
    }

    // Show minutes
    textMinutes = mm;

    // Show am or pm
    textAmPm = ampm;
  };
  clockText();

  const [, forceRender] = useReducer((s: number) => s + 1, 0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let next = () => {
      timer = setTimeout(
        () => {
          forceRender();
          next();
        },
        1000 - (Date.now() % 1000),
      );
    };

    next();
    return () => clearTimeout(timer);
  }, []);

  return (
    <Container className={clsx('clock container pb-2 pt-4', className)} {...props}>
      <div className='clock__container grid'>
        <div className='clock__content grid'>
          <div className='clock__circle'>
            <span className='clock__twelve'></span>
            <span className='clock__three'></span>
            <span className='clock__six'></span>
            <span className='clock__nine'></span>

            <div className='clock__rounder'></div>
            <div
              className='clock__hour'
              id='clock-hour'
              style={{
                transform: `rotateZ(${hAng}deg)`,
              }}
            ></div>
            <div
              className='clock__minutes'
              id='clock-minutes'
              style={{
                transform: `rotateZ(${mAng}deg)`,
              }}
            ></div>
            <div
              className='clock__seconds'
              id='clock-seconds'
              style={{
                transform: `rotateZ(${sAng}deg)`,
              }}
            ></div>
          </div>

          <div>
            <div className='clock__text'>
              <div className='clock__text-hour'>{textHour}</div>
              <div className='clock__text-minutes'>{textMinutes}</div>
              <div className='clock__text-ampm'>{textAmPm}</div>
            </div>

            <div className='clock__date flex justify-center gap-1'>
              <span>{date.toLocaleDateString('default')}</span>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
};
