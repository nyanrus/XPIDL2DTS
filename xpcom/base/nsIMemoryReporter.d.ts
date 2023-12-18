/* -*- Mode: C++; tab-width: 8; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* vim: set ts=8 sts=2 et sw=2 tw=80: */
/* This Source Code Form is subject to the terms of the Mozilla Public * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
//TODO: #include "nsISupports.idl"

interface mozIDOMWindowProxy {}

interface nsIRunnable {}

interface nsISimpleEnumerator {}

/* * Memory reporters measure Firefox's memory usage.  They are primarily used to
 * generate the about:memory page.  You should read
 * https://developer.mozilla.org/en-US/docs/Mozilla/Performance/Memory_reporting
 * before writing a memory reporter.
 */
//[scriptable, function, uuid(62ef0e1c-dbd6-11e3-aa75-3c970e9f4238)]\n
interface nsIHandleReportCallback extends nsISupports {
  /*   * The arguments to the callback are as follows.
   *
   *
   * |process|  The name of the process containing this reporter.  Each
   * reporter initially has "" in this field, indicating that it applies to the
   * current process.  (This is true even for reporters in a child process.)
   * When a reporter from a child process is copied into the main process, the
   * copy has its 'process' field set appropriately.
   *
   *
   * |path|  The path that this memory usage should be reported under.  Paths
   * are '/'-delimited, eg. "a/b/c".
   *
   * Each reporter can be viewed as representing a leaf node in a tree.
   * Internal nodes of the tree don't have reporters.  So, for example, the
   * reporters "explicit/a/b", "explicit/a/c", "explicit/d/e", and
   * "explicit/d/f" define this tree:
   *
   *   explicit
   *   |--a
   *   |  |--b [*]
   *   |  \--c [*]
   *   \--d
   *      |--e [*]
   *      \--f [*]
   *
   * Nodes marked with a [*] have a reporter.  Notice that the internal
   * nodes are implicitly defined by the paths.
   *
   * Nodes within a tree should not overlap measurements, otherwise the
   * parent node measurements will be double-counted.  So in the example
   * above, |b| should not count any allocations counted by |c|, and vice
   * versa.
   *
   * All nodes within each tree must have the same units.
   *
   * If you want to include a '/' not as a path separator, e.g. because the
   * path contains a URL, you need to convert each '/' in the URL to a '\'.
   * Consumers of the path will undo this change.  Any other '\' character
   * in a path will also be changed.  This is clumsy but hasn't caused any
   * problems so far.
   *
   * The paths of all reporters form a set of trees.  Trees can be
   * "degenerate", i.e. contain a single entry with no '/'.
   *
   *
   * |kind|  There are three kinds of memory reporters.
   *
   *  - HEAP: reporters measuring memory allocated by the heap allocator,
   *    e.g. by calling malloc, calloc, realloc, memalign, operator new, or
   *    operator new[].  Reporters in this category must have units
   *    UNITS_BYTES.
   *
   *  - NONHEAP: reporters measuring memory which the program explicitly
   *    allocated, but does not live on the heap.  Such memory is commonly
   *    allocated by calling one of the OS's memory-mapping functions (e.g.
   *    mmap, VirtualAlloc, or vm_allocate).  Reporters in this category
   *    must have units UNITS_BYTES.
   *
   *  - OTHER: reporters which don't fit into either of these categories.
   *    They can have any units.
   *
   * The kind only matters for reporters in the "explicit" tree;
   * aboutMemory.js uses it to calculate "heap-unclassified".
   *
   *
   * |units|  The units on the reporter's amount.  One of the following.
   *
   *  - BYTES: The amount contains a number of bytes.
   *
   *  - COUNT: The amount is an instantaneous count of things currently in
   *    existence.  For instance, the number of tabs currently open would have
   *    units COUNT.
   *
   *  - COUNT_CUMULATIVE: The amount contains the number of times some event
   *    has occurred since the application started up.  For instance, the
   *    number of times the user has opened a new tab would have units
   *    COUNT_CUMULATIVE.
   *
   *    The amount returned by a reporter with units COUNT_CUMULATIVE must
   *    never decrease over the lifetime of the application.
   *
   *  - PERCENTAGE: The amount contains a fraction that should be expressed as
   *    a percentage.  NOTE!  The |amount| field should be given a value 100x
   *    the actual percentage;  this number will be divided by 100 when shown.
   *    This allows a fractional percentage to be shown even though |amount| is
   *    an integer.  E.g. if the actual percentage is 12.34%, |amount| should
   *    be 1234.
   *
   *    Values greater than 100% are allowed.
   *
   *
   * |amount|  The numeric value reported by this memory reporter.  Accesses
   * can fail if something goes wrong when getting the amount.
   *
   *
   * |description|  A human-readable description of this memory usage report.
   */




callback(process: string,path: string,kind: number,units: number,amount: number,description: string,data: nsISupports) : void,



/* * An nsIMemoryReporter reports one or more memory measurements via a
 * callback function which is called once for each measurement.
 *
 * An nsIMemoryReporter that reports a single measurement is sometimes called a
 * "uni-reporter".  One that reports multiple measurements is sometimes called
 * a "multi-reporter".
 *
 * aboutMemory.js is the most important consumer of memory reports.  It
 * places the following constraints on reports.
 *
 * - All reports within a single sub-tree must have the same units.
 *
 * - There may be an "explicit" tree.  If present, it represents
 *   non-overlapping regions of memory that have been explicitly allocated with
 *   an OS-level allocation (e.g. mmap/VirtualAlloc/vm_allocate) or a
 *   heap-level allocation (e.g. malloc/calloc/operator new).  Reporters in
 *   this tree must have kind HEAP or NONHEAP, units BYTES.
 *
 * It is preferred, but not required, that report descriptions use complete
 * sentences (i.e. start with a capital letter and end with a period, or
 * similar).
 */




  /*   * Run the reporter.
   *
   * If |anonymize| is true, the memory reporter should anonymize any
   * privacy-sensitive details in memory report paths, by replacing them with a
   * string such as "<anonymized>". Anonymized memory reports may be sent
   * automatically via crash reports or telemetry.
   *
   * The following things are considered privacy-sensitive.
   *
   * - Content domains and URLs, and information derived from them.
   * - Content data, such as strings.
   * - Details about content code, such as filenames, function names or stack
   *   traces.
   * - Details about or data from the user's system, such as filenames.
   * - Running apps.
   *
   * In short, anything that could identify parts of the user's browsing
   * history is considered privacy-sensitive.
   *
   * The following thing are not considered privacy-sensitive.
   *
   * - Chrome domains and URLs.
   * - Information about installed extensions.
   */




uuid() : }[scriptable,,

  /*   * Kinds. See the |kind| comment in nsIHandleReportCallback.
   */
//const;0
KIND_NONHEAP: number,

//const;1
KIND_HEAP: number,

//const;2
KIND_OTHER: number,

  /*   * Units. See the |units| comment in nsIHandleReportCallback.
   */
//const;0
UNITS_BYTES: number,

//const;1
UNITS_COUNT: number,

//const;2
UNITS_COUNT_CUMULATIVE: number,

//const;3
UNITS_PERCENTAGE: number,







uuid() : }[scriptable, function,,







uuid() : }[scriptable, function,,







  /*   * Initialize.
   */
uuid() : }[scriptable, builtinclass,,

  /*   * Register the given nsIMemoryReporter.  The Manager service will hold a
   * strong reference to the given reporter, and will be responsible for freeing
   * the reporter at shutdown.  You may manually unregister the reporter with
   * unregisterStrongReporter() at any point.
   */
registerStrongReporter(reporter: nsIMemoryReporter) : void,

registerStrongAsyncReporter(reporter: nsIMemoryReporter) : void,

  /*   * Like registerReporter, but the Manager service will hold a weak reference
   * via a raw pointer to the given reporter.  The reporter should be
   * unregistered before shutdown.
   * You cannot register JavaScript components with this function!  Always
   * register your JavaScript components with registerStrongReporter().
   */
registerWeakReporter(reporter: nsIMemoryReporter) : void,

registerWeakAsyncReporter(reporter: nsIMemoryReporter) : void,

  /*   * Unregister the given memory reporter, which must have been registered with
   * registerStrongReporter().  You normally don't need to unregister your
   * strong reporters, as nsIMemoryReporterManager will take care of that at
   * shutdown.
   */
unregisterStrongReporter(reporter: nsIMemoryReporter) : void,

  /*   * Unregister the given memory reporter, which must have been registered with
   * registerWeakReporter().
   */
unregisterWeakReporter(reporter: nsIMemoryReporter) : void,

  /*   * These functions should only be used for testing purposes.
   */
blockRegistrationAndHideExistingReporters() : void,

unblockRegistrationAndRestoreOriginalReporters() : void,

registerStrongReporterEvenIfBlocked(aReporter: nsIMemoryReporter) : void,

  /*   * Get memory reports for the current process and all child processes.
   * |handleReport| is called for each report, and |finishReporting| is called
   * once all reports have been handled.
   *
   * |finishReporting| is called even if, for example, some child processes
   * fail to report back.  However, calls to this method will silently and
   * immediately abort -- and |finishReporting| will not be called -- if a
   * previous getReports() call is still in flight, i.e. if it has not yet
   * finished invoking |finishReporting|.  The silent abort is because the
   * in-flight request will finish soon, and the caller would very likely just
   * catch and ignore any error anyway.
   *
   * If |anonymize| is true, it indicates that the memory reporters should
   * anonymize any privacy-sensitive data (see above).
   */








getReports(handleReport: nsIHandleReportCallback,handleReportData: nsISupports,finishReporting: nsIFinishReportingCallback,finishReportingData: nsISupports,anonymize: boolean) : void,

  /*   * As above, but: If |minimizeMemoryUsage| is true, then each process will
   * minimize its memory usage (see the |minimizeMemoryUsage| method) before
   * gathering its report.  If DMD is enabled and |DMDDumpIdent| is non-empty
   * then write a DMD report to a file in the usual temporary directory (see
   * |dumpMemoryInfoToTempDir| in |nsIMemoryInfoDumper|.)
   */












getReportsExtended(handleReport: nsIHandleReportCallback,handleReportData: nsISupports,finishReporting: nsIFinishReportingCallback,finishReportingData: nsISupports,anonymize: boolean,minimizeMemoryUsage: boolean,DMDDumpIdent: string) : ,

  /*   * As above, but if DMD is enabled and |DMDFile| is non-null then
   * write a DMD report to that file and close it.
   */










getReportsForThisProcessExtended(handleReport: nsIHandleReportCallback,handleReportData: nsISupports,anonymize: boolean,DMDFile: FILE,finishReporting: nsIFinishReportingCallback,finishReportingData: nsISupports) : ,

  /*   * Called by an asynchronous memory reporter upon completion.
   */
  /*   * The memory reporter manager, for the most part, treats reporters
   * registered with it as a black box.  However, there are some
   * "distinguished" amounts (as could be reported by a memory reporter) that
   * the manager provides as attributes, because they are sufficiently
   * interesting that we want external code (e.g. telemetry) to be able to rely
   * on them.
   *
   * Note that these are not reporters and so getReports() does not look at
   * them.  However, distinguished amounts can be embedded in a reporter.
   *
   * Access to these attributes can fail.  In particular, some of them are not
   * available on all platforms.
   *
   * If you add a new distinguished amount, please update
   * toolkit/components/aboutmemory/tests/test_memoryReporters.xul.
   *
   * |vsize| (UNITS_BYTES)  The virtual size, i.e. the amount of address space
   * taken up.
   *
   * |vsizeMaxContiguous| (UNITS_BYTES)  The size of the largest contiguous
   * block of virtual memory.
   *
   * |resident| (UNITS_BYTES)  The resident size (a.k.a. RSS or physical memory
   * used).
   *
   * |residentFast| (UNITS_BYTES)  This is like |resident|, but on Mac OS
   * |resident| can purge pages, which is slow.  It also affects the result of
   * |residentFast|, and so |resident| and |residentFast| should not be used
   * together.
   *
   * |residentPeak| (UNITS_BYTES)  The peak resident size.
   *
   * |residentUnique| (UNITS_BYTES)  The unique set size (a.k.a. USS).
   *
   * |heapAllocated| (UNITS_BYTES)  Memory mapped by the heap allocator.
   *
   * |heapOverheadFraction| (UNITS_PERCENTAGE)  In the heap allocator, this is
   * the fraction of committed heap bytes that are overhead. Like all
   * UNITS_PERCENTAGE measurements, its amount is multiplied by 100x so it can
   * be represented by an int64_t.
   *
   * |JSMainRuntimeGCHeap| (UNITS_BYTES)  Size of the main JS runtime's GC
   * heap.
   *
   * |JSMainRuntimeTemporaryPeak| (UNITS_BYTES)  Peak size of the transient
   * storage in the main JSRuntime.
   *
   * |JSMainRuntimeCompartments{System,User}| (UNITS_COUNT)  The number of
   * {system,user} compartments in the main JS runtime.
   *
   * |JSMainRuntimeRealms{System,User}| (UNITS_COUNT)  The number of
   * {system,user} realms in the main JS runtime.
   *
   * |imagesContentUsedUncompressed| (UNITS_BYTES)  Memory used for decoded
   * raster images in content.
   *
   * |storageSQLite| (UNITS_BYTES)  Memory used by SQLite.
   *
   * |lowMemoryEventsPhysical| (UNITS_COUNT_CUMULATIVE)
   * The number of low-physical-memory events that have occurred since the
   * process started.
   *
   * |ghostWindows| (UNITS_COUNT)  A cached value of the number of ghost
   * windows. This should have been updated within the past 60s.
   *
   * |pageFaultsHard| (UNITS_COUNT_CUMULATIVE)  The number of hard (a.k.a.
   * major) page faults that have occurred since the process started.
   */
//[must_use]
readonlyvsize: number,

//[must_use]
readonlyvsizeMaxContiguous: number,

//[must_use]
readonlyresident: number,

//[must_use]
readonlyresidentFast: number,

//[must_use]
readonlyresidentPeak: number,

//[must_use]
readonlyresidentUnique: number,

//[must_use]
readonlyheapAllocated: number,

//[must_use]
readonlyheapOverheadFraction: number,

//[must_use]
readonlyJSMainRuntimeGCHeap: number,

//[must_use]
readonlyJSMainRuntimeTemporaryPeak: number,

//[must_use]
readonlyJSMainRuntimeCompartmentsSystem: number,

//[must_use]
readonlyJSMainRuntimeCompartmentsUser: number,

//[must_use]
readonlyJSMainRuntimeRealmsSystem: number,

//[must_use]
readonlyJSMainRuntimeRealmsUser: number,

//[must_use]
readonlyimagesContentUsedUncompressed: number,

//[must_use]
readonlystorageSQLite: number,

//[must_use]
readonlylowMemoryEventsPhysical: number,

//[must_use]
readonlyghostWindows: number,

//[must_use]
readonlypageFaultsHard: number,

  /*   * This attribute indicates if moz_malloc_usable_size() works.
   */
//[infallible]
readonlyhasMozMallocUsableSize: boolean,

  /*   * These attributes indicate DMD's status. "Enabled" means enabled at
   * build-time.
   */
//[infallible]
readonlyisDMDEnabled: boolean,

//[infallible]
readonlyisDMDRunning: boolean,

  /*   * Run a series of GC/CC's in an attempt to minimize the application's memory
   * usage.  When we're finished doing this for the current process, we invoke
   * the given runnable if it's not null.  We do not wait for any child processes
   * that might be doing their own minimization via child-mmu-request to finish.
   */
//[must_use]
minimizeMemoryUsage(callback: nsIRunnable) : void,

  /*   * Measure the memory that is known to be owned by this tab, split up into
   * several broad categories.  Note that this will be an underestimate of the
   * true number, due to imperfect memory reporter coverage (corresponding to
   * about:memory's "heap-unclassified"), and due to some memory shared between
   * tabs not being counted.
   *
   * The time taken for the measurement (split into JS and non-JS parts) is
   * also returned.
   */
//[must_use]\n










sizeOfTab(window: mozIDOMWindowProxy,jsObjectsSize: number,jsStringsSize: number,jsOtherSize: number,domSize: number,styleSize: number,otherSize: number,totalSize: number,jsMilliseconds: number,nonJSMilliseconds: number) : void,



