`use strict`;
import {Bot, GameSnapshotInspector, Lugo, Mapper, geo, PLAYER_STATE, distanceBetweenPoints, Region} from '@lugobots/lugo4node'
import {getMyExpectedPosition} from './settings';

type MethodReturn = Lugo.Order[] | { orders: Lugo.Order[]; debug_message: string; } | null;

export class MyBot implements Bot {

    side: Lugo.Team.Side;

    number: number;

    initPosition: Lugo.Point;

    mapper: Mapper;

    constructor(side: Lugo.Team.Side, number: number, initPosition: Lugo.Point, mapper: Mapper) {
        this.side = side
        this.number = number
        this.mapper = mapper
        this.initPosition = initPosition
    }

    onDisputing(inspector: GameSnapshotInspector): MethodReturn {
        try {
            const orders = []
            const me = inspector.getMe()
            const ballPosition = inspector.getBall().getPosition()

            // const ballRegion = this.mapper.getRegionFromPoint(ballPosition)
            // const myRegion = this.mapper.getRegionFromPoint(me.getPosition())

            // by default, I will stay at my tactic position
            let moveDestination = getMyExpectedPosition(inspector, this.mapper, this.number)


            // if the ball is max 2 blocks away from me, I will move toward the ball
            // if (this.isINear(myRegion, ballRegion)) {
            //     moveDestination = ballPosition
            // }

            if (this.shouldIHelp(me, inspector.getMyTeamPlayers(), ballPosition, 2)) {
                console.log("I'm helping!");
                moveDestination = ballPosition;
            }
            else {
                console.log("I'm not helping!");
            }

            const moveOrder = inspector.makeOrderMoveMaxSpeed(moveDestination)

            // Try other ways to create a move Oorder
            // const moveOrder = reader.makeOrderMoveByDirection(DIRECTION.BACKWARD)
            // we can ALWAYS try to catch the ball it we are not holding it
            const catchOrder = inspector.makeOrderCatch()

            orders.push(moveOrder, catchOrder)

            return orders
        } catch (e) {
            console.log(`did not play this turn`, e)
            return null
        }
    }

    onDefending(inspector: GameSnapshotInspector): MethodReturn {
        try {
            const orders = []
            const me = inspector.getMe()
            const ballPosition = inspector.getBall().getPosition()
            // const ballRegion = this.mapper.getRegionFromPoint(ballPosition)
            // const myRegion = this.mapper.getRegionFromPoint(me.getPosition())

            // by default, I will stay at my tactic position
            let moveDestination = getMyExpectedPosition(inspector, this.mapper, this.number)

            // if the ball is max 2 blocks away from me, I will move toward the ball
            // if (this.isINear(myRegion, ballRegion)) {
            //     moveDestination = ballPosition
            // }

            if (this.shouldIHelp(me, inspector.getMyTeamPlayers(), ballPosition, 2)) {
                moveDestination = ballPosition;
            }

            const moveOrder = inspector.makeOrderMoveMaxSpeed(moveDestination)
            const catchOrder = inspector.makeOrderCatch()

            orders.push(moveOrder, catchOrder)
            return orders
        } catch (e) {
            console.log(`did not play this turn`, e)
            return null
        }
    }

    onHolding(inspector: GameSnapshotInspector): MethodReturn {
        try {
            const orders = []
            const me = inspector.getMe()

            const attackGoalCenter = this.mapper.getAttackGoal().getCenter();
            const opponentGoal = this.mapper.getRegionFromPoint(attackGoalCenter)
            const currentRegion = this.mapper.getRegionFromPoint(me.getPosition())

            let myOrder;

            if (this.isINear(currentRegion, opponentGoal)) {
                myOrder = inspector.makeOrderKickMaxSpeed(attackGoalCenter)
            } 
            else {
                myOrder = inspector.makeOrderMoveMaxSpeed(attackGoalCenter)
            }

            orders.push(myOrder)
            return orders
        } catch (e) {
            console.log(`did not play this turn`, e)
            return null
        }
    }

    onSupporting(inspector: GameSnapshotInspector): MethodReturn {
        try {
            const orders = []
            const me = inspector.getMe()
            const ballHolderPosition = inspector.getBall().getPosition()

            // by default, I will stay at my tactic position
            let moveDestination = getMyExpectedPosition(inspector, this.mapper, this.number)

            if (this.shouldIHelp(me, inspector.getMyTeamPlayers(), ballHolderPosition, 2)) {
                moveDestination = ballHolderPosition;
            }

            orders.push(inspector.makeOrderMoveMaxSpeed(moveDestination))
            return orders
        } catch (e) {
            console.log(`did not play this turn`, e)
            return null
        }
    }

    asGoalkeeper(inspector: GameSnapshotInspector, state: PLAYER_STATE): MethodReturn {
        try {
            const orders = []
            const me = inspector.getMe()
            let position = inspector.getBall().getPosition()
            if (state !== PLAYER_STATE.DISPUTING_THE_BALL) {
                position = this.mapper.getDefenseGoal().getCenter()
            }

            const myOrder = inspector.makeOrderMoveMaxSpeed(position)

            orders.push(myOrder, inspector.makeOrderCatch())
            return orders
        } catch (e) {
            console.log(`did not play this turn`, e)
            return null
        }
    }

    gettingReady(inspector: GameSnapshotInspector): void {
        // This method is called when the score is changed or before the game starts.
        // We can change the team strategy or do anything else based on the outcome of the game so far.
        // for now, we are not going anything here.
    }

    private isINear(myPosition: Region, targetPosition: Region): boolean {
        const minDist = 2;
        const colDist = myPosition.getCol() - targetPosition.getCol()
        const rowDist = myPosition.getRow() - targetPosition.getRow()
        return Math.hypot(colDist, rowDist) <= minDist
    }

    private shouldIHelp(me: Lugo.Player, myTeam: Lugo.Player[], targetPosition: Lugo.Point, maxHelpers: number): boolean {
    let nearestPlayers = 0;
    const myDistance = geo.distanceBetweenPoints(me.getPosition(), targetPosition)
    // console.log(`My distance : ${myDistance}`);
    for(const teamMate of myTeam) {
        if(teamMate.getNumber() != me.getNumber() && geo.distanceBetweenPoints(teamMate.getPosition(), targetPosition) < myDistance){
        nearestPlayers++;
        // console.log(`Mate distance : ${geo.distanceBetweenPoints(teamMate.getPosition(), targetPosition)}`);
        if(nearestPlayers >= maxHelpers) {
            return false;
        }
        }
    }
    return true;
    }

}
