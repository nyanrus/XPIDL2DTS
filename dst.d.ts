/* -*- Mode: C++; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*-
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */
#include "nsISupports.idl"
#include  "nsINamed.idl"
interface nsIObserver;
interface nsIEventTarget;
native MallocSizeOf(mozilla::MallocSizeOf);
native nsTimerCallbackFunc(nsTimerCallbackFunc);
[ref] native TimeDuration(mozilla::TimeDuration);
/**
* The callback interface for timers.
*/
interface nsITimer;
[function, scriptable, uuid(a796816d-7d47-4348-9ab8-c7aeb3216a7d)]interface nsITimerCallback : nsISupports{
/**
* @param aTimer the timer which has expired
*/
void notify(in nsITimer timer);
};
/**
* nsITimer instances must be initialized by calling one of the "init" methods
* documented below.  You may also re-initialize (using one of the init()
* methods) an existing instance to avoid the overhead of destroying and
* creating a timer.  It is not necessary to cancel the timer in that case.
*
* By default a timer will fire on the thread that created it.  Set the .target
* attribute to fire on a different thread.  Once you have set a timer's .target
* and called one of its init functions, any further interactions with the timer
* (calling cancel(), changing member fields, etc) should only be done by the
* target thread, or races may occur with bad results like timers firing after
* they've been canceled, and/or not firing after re-initiatization.
*/
[scriptable, builtinclass, uuid(3de4b105-363c-482c-a409-baac83a01bfc)]interface nsITimer : nsISupports{
/* Timer types */
/**
* Type of a timer that fires once only.
*/
const short TYPE_ONE_SHOT = 0;
/**
* After firing, a TYPE_REPEATING_SLACK timer is stopped and not restarted
* until its callback completes.  Specified timer period will be at least
* the time between when processing for last firing the callback completes
* and when the next firing occurs.
*
* This is the preferable repeating type for most situations.
*/
const short TYPE_REPEATING_SLACK = 1;
/**
* TYPE_REPEATING_PRECISE is just a synonym for
* TYPE_REPEATING_PRECISE_CAN_SKIP. They used to be distinct, but the old
* TYPE_REPEATING_PRECISE kind was similar to TYPE_REPEATING_PRECISE_CAN_SKIP
* while also being less useful. So the distinction was removed.
*/
const short TYPE_REPEATING_PRECISE = 2;
/**
* A TYPE_REPEATING_PRECISE_CAN_SKIP repeating timer aims to have constant
* period between firings.  The processing time for each timer callback will
* not influence the timer period.  If the callback finishes after the next
* firing(s) should have happened (either because the callback took a long
* time, or the callback was called extremely late), that firing(s) is
* skipped, but the following sequence of firing times will not be altered.
* This timer type guarantees that it will not queue up new events to fire
* the callback until the previous callback event finishes firing.  This is
* the only non-slack timer available.
*/
const short TYPE_REPEATING_PRECISE_CAN_SKIP = 3;
/**
* Same as TYPE_REPEATING_SLACK with the exception that idle events
* won't yield to timers with this type.  Use this when you want an
* idle callback to be scheduled to run even though this timer is
* about to fire.
*/
const short TYPE_REPEATING_SLACK_LOW_PRIORITY = 4;
/**
* Same as TYPE_ONE_SHOT with the exception that idle events won't
* yield to timers with this type.  Use this when you want an idle
* callback to be scheduled to run even though this timer is about
* to fire.
*/
const short TYPE_ONE_SHOT_LOW_PRIORITY = 5;
/**
* Initialize a timer that will fire after the said delay.
* A user must keep a reference to this timer till it is
* is no longer needed or has been cancelled.
*
* @param aObserver   the callback object that observes the
*                    ``timer-callback'' topic with the subject being
*                    the timer itself when the timer fires:
*
*                    observe(nsISupports aSubject, => nsITimer
*                            string aTopic,        => ``timer-callback''
*                            wstring data          =>  null
*
* @param aDelayInMs  delay in milliseconds for timer to fire
* @param aType       timer type per TYPE* consts defined above
*/
void init(in nsIObserver aObserver, in unsigned long aDelayInMs,in unsigned long aType);
/**
* Initialize a timer to fire after the given millisecond interval.
* This version takes a callback object.
*
* @param aFunc       nsITimerCallback interface to call when timer expires
* @param aDelayInMs  The millisecond interval
* @param aType       Timer type per TYPE* consts defined above
*/
void initWithCallback(in nsITimerCallback aCallback,in unsigned long aDelayInMs,in unsigned long aType);
/**
* Initialize a timer to fire after the high resolution TimeDuration.
* This version takes a callback object.
*
* @param aFunc      nsITimerCallback interface to call when timer expires
* @param aDelay     The high resolution interval
* @param aType      Timer type per TYPE* consts defined above
*/
[noscript] void initHighResolutionWithCallback(in nsITimerCallback aCallback,[const] in TimeDuration aDelay,in unsigned long aType);
/**
* Cancel the timer.  This method works on all types, not just on repeating
* timers -- you might want to cancel a TYPE_ONE_SHOT timer, and even reuse
* it by re-initializing it (to avoid object destruction and creation costs
* by conserving one timer instance).
*/
void cancel();
/**
* Like initWithFuncCallback, but also takes a name for the timer; the name
* will be used when timer profiling is enabled via the "TimerFirings" log
* module.
*
* @param aFunc      The function to invoke
* @param aClosure   An opaque pointer to pass to that function
* @param aDelay     The millisecond interval
* @param aType      Timer type per TYPE* consts defined above
* @param aName      The timer's name
*/
[noscript] void initWithNamedFuncCallback(in nsTimerCallbackFunc aCallback,in voidPtr aClosure,in unsigned long aDelay,in unsigned long aType,in string aName);
/**
* Initialize a timer to fire after the high resolution TimeDuration.
* This version takes a named function callback.
*
* @param aFunc      The function to invoke
* @param aClosure   An opaque pointer to pass to that function
* @param aDelay     The high resolution interval
* @param aType      Timer type per TYPE* consts defined above
* @param aName      The timer's name
*/
[noscript] void initHighResolutionWithNamedFuncCallback(in nsTimerCallbackFunc aCallback,in voidPtr aClosure,[const] in TimeDuration aDelay,in unsigned long aType,in string aName);
/**
* The millisecond delay of the timeout.
*
* NOTE: Re-setting the delay on a one-shot timer that has already fired
* doesn't restart the timer. Call one of the init() methods to restart
* a one-shot timer.
*/
attribute unsigned long delay;
/**
* The timer type - one of the above TYPE_* constants.
*/
attribute unsigned long type;
/**
* The opaque pointer pass to initWithFuncCallback.
*/
[noscript] readonly attribute voidPtr closure;
/**
* The nsITimerCallback object passed to initWithCallback.
*/
readonly attribute nsITimerCallback callback;
/**
* The nsIEventTarget where the callback will be dispatched. Note that this
* target may only be set before the call to one of the init methods above.
*
* By default the target is the thread that created the timer.
*/
attribute nsIEventTarget target;
readonly attribute ACString name;
/**
* The number of microseconds this nsITimer implementation can possibly
* fire early.
*/
[noscript] readonly attribute unsigned long allowedEarlyFiringMicroseconds;
[notxpcom, nostdcall] size_t sizeOfIncludingThis(in MallocSizeOf aMallocSizeOf);
};
[scriptable, builtinclass, uuid(5482506d-1d21-4d08-b01c-95c87e1295ad)]interface nsITimerManager : nsISupports{
/**
* Returns a read-only list of nsITimer objects, implementing only the name,
* delay and type attribute getters.
* This is meant to be used for tests, to verify that no timer is leftover
* at the end of a test. */
Array<nsITimer> getTimers();
};
