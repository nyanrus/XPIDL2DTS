/* -*- Mode: C++; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4 -*- */
/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */
///INCLUDE #include "nsISupports.idl"
///ONELINE_INTERFACE export interface nsISimpleEnumerator {}
/**
* nsIArray
*
* An indexed collection of elements. Provides basic functionality for
* retrieving elements at a specific position, searching for
* elements. Indexes are zero-based, such that the last element in the
* array is stored at the index length-1.
*
* For an array which can be modified, see nsIMutableArray below.
*
* Neither interface makes any attempt to protect the individual
* elements from modification. The convention is that the elements of
* the array should not be modified. Documentation within a specific
* interface should describe variations from this convention.
*
* It is also convention that if an interface provides access to an
* nsIArray, that the array should not be QueryInterfaced to an
* nsIMutableArray for modification. If the interface in question had
* intended the array to be modified, it would have returned an
* nsIMutableArray!
*
* null is a valid entry in the array, and as such any nsISupports
* parameters may be null, except where noted.
*/
export interface nsIArray extends nsISupports {
/**
* length
*
* number of elements in the array.
*/
readonly length:number;
/**
* queryElementAt()
*
* Retrieve a specific element of the array, and QueryInterface it
* to the specified interface. null is a valid result for
* this method, but exceptions are thrown in other circumstances
*
* @param index position of element
* @param uuid the IID of the requested interface
* @param result the object, QI'd to the requested interface
*
* @throws NS_ERROR_NO_INTERFACE when an entry exists at the
*         specified index, but the requested interface is not
*         available.
* @throws NS_ERROR_ILLEGAL_VALUE when index > length-1
*
*/
queryElementAt: (index: number,///in
uuid: any,///in
) => object;
/**
* indexOf()
*
* Get the position of a specific element. Note that since null is
* a valid input, exceptions are used to indicate that an element
* is not found.
*
* @param startIndex The initial element to search in the array
*                   To start at the beginning, use 0 as the
*                   startIndex
* @param element    The element you are looking for
* @returns a number >= startIndex which is the position of the
*          element in the array.
* @throws NS_ERROR_FAILURE if the element was not in the array.
*/
indexOf: (startIndex: number,///in
element: nsISupports,///in
) => number;
/**
* enumerate the array
*
* @returns a new enumerator positioned at the start of the array
* @throws NS_ERROR_FAILURE if the array is empty (to make it easy
*         to detect errors), or NS_ERROR_OUT_OF_MEMORY if out of memory.
*/
///FUNCTION [binaryname(ScriptedEnumerate), optional_argc]
enumerate: (aElemIID: any,///in
) => nsISimpleEnumerator;
};

///EXPORT {"type":[],"interface":["nsIArray"]}
///UNRESOLVED_TYPES ["nsISupports","nsISimpleEnumerator"]
///CONSTANTS {}