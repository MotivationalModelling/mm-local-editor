import { useState } from "react";
import "./ProgressBar.css";
import { Popover, OverlayTrigger } from "react-bootstrap";
import { FaInfoCircle } from "react-icons/fa";
import { MdOutlineNavigateNext, MdOutlineNavigateBefore } from "react-icons/md";

enum TabOptions {
	Cluster,
	Graph,
}

type ProgressBarProps = {
	setShowGoalSection: (showGoalSection: boolean) => void;
	setShowGraphSection: (showGraphSection: boolean) => void;
};

const ProgressBar = ({
	setShowGoalSection,
	setShowGraphSection,
}: ProgressBarProps) => {
	const [selectedTab, setSelectedTab] = useState(TabOptions.Cluster);

	const handleClusterBarClick = () => {
		setSelectedTab(TabOptions.Cluster);
		setShowGoalSection(true);
		setShowGraphSection(false);
	};

	const handleGraphBarClick = () => {
		setSelectedTab(TabOptions.Graph);
		setShowGoalSection(false);
		setShowGraphSection(true);
	};

	const clusterInfoPopover = (
		<Popover style={{ maxWidth: "max-content" }}>
			<Popover.Body>
				• Click the goal and use{" "}
				<strong>
					<code>[delete]</code>
				</strong>{" "}
				to delete a goal <br />• Click the last goal on the goal list and use{" "}
				<strong>
					<code>[return]</code>
				</strong>{" "}
				to generate a new goal <br />
				• Drag the goal from the goal list on the left section and drop it into
				the cluster on the right section
				<br />
				• Drag the goal in the cluster to the right or left sides to achieve the
				hierarchical structure <br />
			</Popover.Body>
		</Popover>
	);

	const graphInfoPopover = (
		<Popover style={{ maxWidth: "max-content" }}>
			<Popover.Body>
				• Click{" "}
				<strong>
					<code>Edit All</code>
				</strong>{" "}
				on the left section to edit the names of goals <br />• Click{" "}
				<strong>
					<code>Drag All</code>
				</strong>{" "}
				on the left section to drag the cluster into the graph on the right
				section
				<br />• Click{" "}
				<strong>
					<code>Render</code>
				</strong>{" "}
				on the left section to generate the goal modal
				<br />
			</Popover.Body>
		</Popover>
	);

	return (
		<div
			style={{
				width: "auto",
				minWidth: "1280px",
				overflowY: "hidden",
				maxWidth: "100%",
			}}
		>
			<div className="arrow-steps clearfix mb-1">
				<div
					className={`step ${
						selectedTab === TabOptions.Cluster ? "current" : ""
					}`}
					style={{ width: selectedTab === TabOptions.Cluster ? "93vw" : "5vw" }}
					id="clusterTab"
					onClick={handleClusterBarClick}
				>
					{selectedTab === TabOptions.Graph ? (
						<span className="d-flex align-items-center">
							<MdOutlineNavigateBefore size={20} /> Prev
						</span>
					) : (
						<span className="d-flex justify-content-around">
							<span>Enter Goals</span>
							<span>
								Arrange Hierarchy
								<OverlayTrigger
									trigger={"click"}
									placement="right"
									overlay={clusterInfoPopover}
								>
									<span>
										<FaInfoCircle style={{ marginLeft: "5px" }} />
									</span>
								</OverlayTrigger>
							</span>
						</span>
					)}
				</div>
				<div
					className={`step ${
						selectedTab === TabOptions.Graph ? "current" : ""
					}`}
					style={{ width: selectedTab === TabOptions.Graph ? "93vw" : "5vw" }}
					id="graphTab"
					onClick={handleGraphBarClick}
				>
					{selectedTab === TabOptions.Cluster ? (
						<span className="d-flex align-items-center">
							Next <MdOutlineNavigateNext size={20} />
						</span>
					) : (
						<span className="d-flex justify-content-around">
							<span>Arrange Hierarchy</span>
							<span>
								Render Model
								<OverlayTrigger
									trigger={"click"}
									placement="left"
									overlay={graphInfoPopover}
								>
									<span>
										<FaInfoCircle style={{ marginLeft: "5px" }} />
									</span>
								</OverlayTrigger>
							</span>
						</span>
					)}
				</div>
			</div>
		</div>
	);
};

export default ProgressBar;
