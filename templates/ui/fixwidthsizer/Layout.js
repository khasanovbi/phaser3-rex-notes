import NOOP from '../../../plugins/utils/object/NOOP.js';
import ResizeGameObject from '../utils/ResizeGameObject.js';
import RunChildrenWrap from './RunChildrenWrap.js';

const Zone = Phaser.GameObjects.Zone;
const AlignIn = Phaser.Display.Align.In.QuickSet;

var Layout = function (parent) {
    // Skip invisible sizer
    if (!this.visible) {
        return this;
    }

    var isTopSizer = (parent === undefined);

    // Set size
    var newWidth, newHeight;
    var expandX, expandY;
    if (!isTopSizer) {
        if (this.rexSizer.expand) {
            if (parent.orientation === 0) { // x
                expandY = 1;
            } else { // y
                expandX = 1;
            }
        }
        if (this.rexSizer.proportion > 0) {
            if (parent.orientation === 0) { // x
                expandX = 2;
            } else { // y
                expandY = 2;
            }
        }
    }
    switch (expandX) {
        case 1: // rexSizer.expand
            var padding = this.rexSizer.padding;
            newWidth = parent.width - padding.left - padding.right;
            break;
        case 2: // rexSizer.proportion > 0
            var padding = this.rexSizer.padding;
            newWidth = (this.rexSizer.proportion * parent.proportionLength) - padding.left - padding.right;
            break;
        default:
            var padding = this.padding;
            newWidth = Math.max(this.maxChildWidth + padding.left + padding.right, this.minWidth);
            break;
    }
    switch (expandY) {
        case 1: // rexSizer.expand
            var padding = this.rexSizer.padding;
            newHeight = parent.height - padding.top - padding.bottom;
            break;
        case 2: // rexSizer.proportion > 0
            var padding = this.rexSizer.padding;
            newHeight = (this.rexSizer.proportion * parent.proportionLength) - padding.top - padding.bottom;
            break;
        default:
            var padding = this.padding;
            newHeight = Math.max(this.maxChildHeight + padding.top + padding.bottom, this.minHeight);
            break;
    }

    var lineInnerWidth, padding = this.padding;
    if (this.orientation === 0) { // x
        lineInnerWidth = newWidth - padding.left - padding.right;
    } else { // y
        lineInnerWidth = newHeight - padding.top - padding.bottom;
    }
    var wrapResult = RunChildrenWrap.call(this, lineInnerWidth);   
    // Expand height is less then min-lines-height
    if (this.orientation === 0) { // x
        newHeight = Math.max(newHeight, wrapResult.height + padding.top + padding.bottom);
    } else { // y
        newWidth = Math.max(newWidth, wrapResult.height + left + padding.right);
    }
    this.resize(newWidth, newHeight);

    // Layout children    
    var children = this.sizerChildren;
    var child, childConfig, padding;
    var startX = this.left,
        startY = this.top;
    var itemX, itemY;
    var x, y, width, height; // Align zone


    // Layout each line
    var lines = wrapResult.lines;
    var line, lineChlidren;
    if (this.orientation === 0) { // x
        itemX = startX
        itemY = startY + this.padding.top;
    } else {
        itemX = startX + this.padding.left;
        itemY = startY
    }
    for (var i = 0, icnt = lines.length; i < icnt; i++) {
        line = lines[i];
        lineChlidren = line.children;

        for (var j = 0, jcnt = lineChlidren.length; j < jcnt; j++) {
            child = lineChlidren[j];
            childConfig = child.rexSizer;
            padding = childConfig.padding;
            if (this.orientation === 0) { // x
                x = (itemX + padding.left);
                if (j === 0) {
                    x += this.padding.left;
                } else {
                    x += this.itemSpacing;
                }

                y = (itemY + padding.top);
                width = child.width;
                height = child.height;
                itemX = x + child.width + padding.right;
            } else { // y
                x = (itemX + padding.left);

                y = (itemY + padding.top);
                if (j === 0) {
                    y += this.padding.top;
                } else {
                    y += this.itemSpacing;
                }

                width = child.width;
                height = child.height;
                itemY = y + child.height + padding.bottom;
            }

            tmpZone.setPosition(x, y).setSize(width, height);
            AlignIn(child, tmpZone, childConfig.align);
            this.resetChildState(child);
        }

        if (this.orientation === 0) { // x
            itemX = startX;
            itemY += line.height + this.lineSpacing;
        } else { // y
            itemX += line.height + this.lineSpacing;
            itemY = startY;
        }
    }

    // Layout background children
    for (var i = 0, cnt = this.backgroundChildren.length; i < cnt; i++) {
        child = this.backgroundChildren[i];
        // Skip invisible child
        if (!child.visible) {
            continue;
        }
        childConfig = child.rexSizer;
        padding = childConfig.padding;
        x = (startX + padding.left);
        y = (startY + padding.top);
        width = this.width - padding.left - padding.right;
        height = this.height - padding.top - padding.bottom;
        ResizeGameObject(child, width, height);
        tmpZone.setPosition(x, y).setSize(width, height);
        AlignIn(child, tmpZone, childConfig.align);
        this.resetChildState(child);
    }

    return this;
}

var tmpZone = new Zone({
    sys: {
        queueDepthSort: NOOP,
        events: {
            once: NOOP
        }
    }
}, 0, 0, 1, 1);
tmpZone.setOrigin(0);

export default Layout;