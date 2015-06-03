/* Summary:
 The planView page needs to respond to mouse events differently than
 the default x3dom functionality.  Double clicks need to route to the
 RackView tab of the rack double clicked, dragging with the left mouse
 should pan the rack image instead of rotating it, and scrolling should
 zoom in and out rather than pan the image up and down.
 */
/* global x3dom */
define(['thirdparty/x3dom'], function () {
    'use strict';

    return function (getZoomValueZoom) {

        // REIVEW SL: why are ypu checking if the prototype is a function?
        // Won't it always be a function?

        // REIVEW SL: good comments though.

        // x3dom handles double click events by centering the point double
        // clicked in the middle of the canvas.  Instead we'd like x3dom.js
        // to trigger a doubleclick event on the transform element that was
        // double clicked so we can attach custom event handlers to it. 
        if (typeof x3dom.Viewarea.prototype.onDoubleClick === 'function') {
            x3dom.Viewarea.prototype.onDoubleClick = function(x, y) {
                this.prepareEvents(x, y, null, 'ondblclick');
                return;
            };
        } else {
            console.error('Could not overwrite x3dom.Viewarea.onDoubleClick');
        }

        // The onDrag function in x3dom.js defines the event handling for all mouse
        // drage events (left click drag, middle click drag, right click drag and 
        // scrolling.  Here we redefine all the event handlers so right click and
        // middle click drags will be no-op, left click drag will pan the image and
        // scrolling will zoom in and out.
        if (typeof x3dom.Viewarea.prototype.onDrag === 'function') {

            // This is a custom function created to try and change the current viewpoint
            // to zoom in or out more.  This function is called by the zoom slider as well.
            x3dom.Viewarea.prototype.tryZoom = function(viewPointChangeValue) {
                var viewpoint = this._scene.getViewpoint();
                viewPointChangeValue = getZoomValueZoom(viewpoint, viewPointChangeValue);
                if (viewPointChangeValue !== 0) {
                    var vec = new x3dom.fields.SFVec3f(0, 0, viewPointChangeValue);
                    if (x3dom.isa(viewpoint, x3dom.nodeTypes.OrthoViewpoint)) {
                        viewpoint._vf.fieldOfView[0] += vec.z;
                        viewpoint._vf.fieldOfView[1] += vec.z;
                        viewpoint._vf.fieldOfView[2] -= vec.z;
                        viewpoint._vf.fieldOfView[3] -= vec.z;
                        viewpoint._projMatrix = null;
                    } else {
                        this._movement = this._movement.add(vec);
                        var mat = this.getViewpointMatrix().mult(this._transMat);
                        this._transMat = mat.inverse().mult(x3dom.fields.SFMatrix4f.translation(this._movement)).mult(mat);
                    }
                }

                return viewPointChangeValue;
            };

            // overwrite the default drag functionality of x3dom.
            x3dom.Viewarea.prototype.onDrag = function(x, y, buttonState) {
                this.handleMoveEvt(x, y, buttonState);
                if (this._currentInputType == x3dom.InputTypes.NAVIGATION) {
                    var navi = this._scene.getNavigationInfo();
                    var navType = navi.getType();
                    var navRestrict = navi.getExplorationMode();
                    if (navType === 'none' || navRestrict == 0) {
                        return;
                    }
                    var dx = x - this._lastX;
                    var dy = y - this._lastY;
                    var d, vec, mat = null;
                    buttonState = (!navRestrict || (navRestrict != 7 && buttonState == 1)) ? navRestrict : buttonState;

                    // Left click drag: pan image
                    if (buttonState & 1) {
                        d = (this._scene._lastMax.subtract(this._scene._lastMin)).length();
                        d = ((d < x3dom.fields.Eps) ? 1 : d) * navi._vf.speed;
                        vec = new x3dom.fields.SFVec3f(d * dx / this._width, d * (-dy) / this._height, 0);
                        this._movement = this._movement.add(vec);
                        mat = this.getViewpointMatrix().mult(this._transMat);
                        this._transMat = mat.inverse().mult(x3dom.fields.SFMatrix4f.translation(this._movement)).mult(mat);
                    }
                    // Scroll wheel
                    if (buttonState & 2) {
                        d = (this._scene._lastMax.subtract(this._scene._lastMin)).length();
                        d = ((d < x3dom.fields.Eps) ? 1 : d) * navi._vf.speed;
                        var viewPointChange = -1 * d * (dx + dy) / this._height;
                        this._isMoving = this.tryZoom(viewPointChange);
                    }
                }
                this._dx = dx;
                this._dy = dy;
                this._lastX = x;
                this._lastY = y;
            };
        } else {
            console.error('Could not overwrite x3dom.Viewarea.onDrag');
        }
    };
});