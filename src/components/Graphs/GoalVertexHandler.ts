import {EventSource, InternalMouseEvent, VertexHandler} from "@maxgraph/core";

export class GoalVertexHandler extends VertexHandler {
    override mouseDown(sender: EventSource, event: InternalMouseEvent): void {
        // maxGraph 0.13 skips handle 0 (top-left) through a truthiness check.
        if (!event.isConsumed() && this.graph.isEnabled() && this.getHandleForEvent(event) === 0) {
            this.start(event.getGraphX(), event.getGraphY(), 0);
            event.consume();
        } else {
            super.mouseDown(sender, event);
        }
    }
}
