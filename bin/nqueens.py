#!/usr/bin/env python
from math import *
import sys
 
chosen = {}
n = int(sys.argv[1])
 
def place(xpos, ypos):
    if (ypos in chosen.values()):
        return False
    opponent = 1
    while(opponent < xpos):
        if abs(chosen[opponent]-ypos) == abs(opponent-xpos):
            return False
        opponent+=1
    return True
 
def clear_all_future_positions(xpos):
    for i in range(xpos,n+1):
       chosen[i]=None
 
def NQueens(xpos):
    for ypos in range(1, n + 1):
        #clear_all_future_positions(xpos)
        if place(xpos, ypos):
            chosen[xpos] = ypos
   #        print 'chosen=',chosen
            if (xpos==n):
                pass
            else:
                NQueens(xpos+1)
 #  print 'NQueens(',xpos,') returns'
clear_all_future_positions(1)
NQueens(1)
for x in range(1, n+1):
    for y in range(1, n+1):
        cur = chosen[x]
        if cur == y:
            print " Q",
        else:
            print " -",
    print ""
    
